import { computed } from 'vue'

export function useSlotValidation(SCH, INVAS, AERONAVES, parsedSlots) {
  
  function hv(hora) {
    const m = hora && hora.match(/^(\d+):(\d+)/)
    return m ? +m[1] + +m[2] / 60 : 0
  }

  function getTimestamp(data, hora) {
    if (!data || !hora) return 0
    const [d, m, y] = data.split('/').map(Number)
    const [h, min] = hora.split(':').map(Number)
    return new Date(y, m - 1, d, h, min).getTime()
  }

  const aeronaveStats = computed(() => {
    const stats = {}
    const usage = {}
    const now = new Date().getTime()
    
    const allSlots = [...parsedSlots.value]
      .filter(s => s.ae && s.aeronaveId)
      .sort((a, b) => getTimestamp(a.data, a.hora) - getTimestamp(b.data, b.hora))

    allSlots.forEach(s => {
      const ae = AERONAVES.value.find(a => a.id == s.aeronaveId)
      if (ae) {
        const modNome = (ae.modeloAeronave?.nome || '').toUpperCase()
        const isSim = modNome.includes('SM PCATD') || modNome.includes('SM AATD') || modNome.includes('SM PCTAD')
        if (!isSim) {
          const slotTime = getTimestamp(s.data, s.hora)
          
          // Performance/Logic: Only consume hours for FUTURE slots (from now onwards)
          if (slotTime >= now) {
            usage[s.aeronaveId] = (usage[s.aeronaveId] || 0) + 1
          }
          
          const currentUsage = usage[s.aeronaveId] || 0
          const val = parseFloat(ae.horasDisponiveis || 0) - (currentUsage * 1.5)
          const key = s.apiId || `${s.barra}|${s.data}|${s.hora}`
          stats[key] = val
        }
      }
    })
    return stats
  })

  const getAeronaveHours = (slot) => {
    if (!slot.ae) return null
    const key = slot.apiId || `${slot.barra}|${slot.data}|${slot.hora}`
    return aeronaveStats.value[key]
  }

  const getSlotAlerts = (slot) => {
    const alerts = []
    
    // 1. Status da Operação e Impedimentos Técnicos
    const techImpediments = ['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE']
    const hasTechImpediment = techImpediments.includes(slot.st)
    if (hasTechImpediment) {
      alerts.push(`Impedimento/Status: ${slot.st}`)
      if (slot.inva) {
        alerts.push(`Ação Requerida: Remova o instrutor deste slot (${slot.st}).`)
      }
    }

    // 2. Observações do Slot
    if (slot.obs && slot.obs.trim()) {
      alerts.push(`Atente-se às observações do slot!`)
    }

    if (!slot.aluno || hasTechImpediment) return alerts

    // 3. Dados Incompletos
    if (!slot.inva || !slot.ae || slot.st === 'PENDENTE' || slot.st === 'AGUARDANDO CONFIRMAÇÃO') {
      const missingFields = []
      if (!slot.inva) missingFields.push('Instrutor')
      if (!slot.ae) missingFields.push('Aeronave')
      if (slot.st === 'PENDENTE' || slot.st === 'AGUARDANDO CONFIRMAÇÃO') missingFields.push('Status Final')
      
      alerts.push(`Dados Incompletos: Falta preencher/definir ${missingFields.join(', ')}.`)
    }
    
    // 4. Conflito Simultâneo (Instrutor e Aeronave)
    const sameTimeInva = SCH.value.filter(s => slot.inva && s.inva === slot.inva && s.hora === slot.hora && s.id !== slot.id && s.aluno && !techImpediments.includes(s.st))
    if (sameTimeInva.length > 0) {
      alerts.push(`Conflito Simultâneo: Instrutor já alocado em ${sameTimeInva[0].barra}.`)
    }

    const sameTimeAe = SCH.value.filter(s => slot.ae && s.ae === slot.ae && s.hora === slot.hora && s.id !== slot.id && s.aluno && !techImpediments.includes(s.st))
    if (sameTimeAe.length > 0) {
      alerts.push(`Conflito de Aeronave: ${slot.ae} já está alocada em ${sameTimeAe[0].barra} neste horário.`)
    }

    // 4b. Validação Noturna (Somente Diurna)
    const hour = hv(slot.hora)
    if (hour >= 17 && slot.aeronaveId) {
       const aeObj = AERONAVES.value.find(a => a.id == slot.aeronaveId)
       if (aeObj && aeObj.restricoes) {
         const isSomenteDiurna = aeObj.restricoes.some(r => 
           (r.nome || '').toUpperCase().includes('SOMENTE DIURNA') || 
           (r.observacao || '').toUpperCase().includes('SOMENTE DIURNA')
         )
         if (isSomenteDiurna) {
           alerts.push(`⚠️ ALERTA NOTURNO: Aeronave restrita (Somente Diurna) operando após as 17:00.`)
         }
       }
    }

    // 4c. Alerta de Manutenção Predisposto
    if (slot.ae) {
      const pred = getAeronaveHours(slot)
      if (pred !== null && pred < 10) {
        alerts.push(`Coordenar parada para manutenção (Previsão: ${pred.toFixed(1)}h).`)
      }
    }

    // 5. Conflito de Disponibilidade (Escala de Trabalho)
    if (slot.inva) {
      const i = INVAS.value.find(x => x.nome === slot.inva)
      if (i && Array.isArray(i.escalas)) {
        const [day, month, year] = slot.data.split('/')
        const dStr = `${year}-${month}-${day}`
        const s = i.escalas.find(x => x.data.startsWith(dStr))
        
        if (s) {
          const tipoNome = (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase()
          const isAvailable = tipoNome.includes('disponivel') || tipoNome.includes('disponível')
          
          if (!isAvailable) {
            alerts.push(`Indisponibilidade: Instrutor alocado mas consta como "${s.tipoDisponibilidade?.nome || s.tipo}" na escala oficial${s.periodo ? ' (' + s.periodo + ')' : ''}.`)
          } else if (s.periodo && s.periodo.toLowerCase() !== 'x') {
            const p = s.periodo.toLowerCase()
            const hour = hv(slot.hora)
            let periodError = false
            let periodName = ''
            if (p === 'm' && hour >= 12) { periodError = true; periodName = 'Manhã' }
            else if (p === 't' && (hour < 12 || hour >= 18)) { periodError = true; periodName = 'Tarde' }
            else if (p === 'n' && hour < 18) { periodError = true; periodName = 'Noite' }

            if (periodError) {
              alerts.push(`Conflito de Turno: Instrutor alocado às ${slot.hora}, mas sua escala é apenas para o período da ${periodName}.`)
            }
          }
        }
      }
    }

    // 6. Consecutividade de Aluno (Mesmo Instrutor e Aeronave)
    if (slot.aluno) {
      const studentSlotsToday = SCH.value.filter(s => s.aluno === slot.aluno).sort((a, b) => hv(a.hora) - hv(b.hora))
      const myTime = hv(slot.hora)
      const prevSlot = studentSlotsToday.find(s => Math.abs(myTime - hv(s.hora) - 2) < 0.1)
      const nextSlot = studentSlotsToday.find(s => Math.abs(hv(s.hora) - myTime - 2) < 0.1)
      
      if (prevSlot && prevSlot.inva && slot.inva && prevSlot.inva !== slot.inva) alerts.push(`Treinamento em Sequência: Aluno possui slot anterior (${prevSlot.hora}) com instrutor diferente (${prevSlot.inva}).`)
      if (nextSlot && nextSlot.inva && slot.inva && nextSlot.inva !== slot.inva) alerts.push(`Treinamento em Sequência: Aluno possui slot seguinte (${nextSlot.hora}) com instrutor diferente (${nextSlot.inva}).`)
      if (prevSlot && prevSlot.ae && slot.ae && prevSlot.ae !== slot.ae) alerts.push(`Voo em Sequência: Aluno possui slot anterior (${prevSlot.hora}) com aeronave diferente (${prevSlot.ae}).`)
      if (nextSlot && nextSlot.ae && slot.ae && nextSlot.ae !== slot.ae) alerts.push(`Voo em Sequência: Aluno possui slot seguinte (${nextSlot.hora}) com aeronave diferente (${nextSlot.ae}).`)
    }

    // 7. Descanso CLT com Folgas (Regra 12h + 24h)
    if (slot.inva && slot.aluno) {
      const i = INVAS.value.find(x => x.nome === slot.inva)
      const sit = String(i?.situacao?.nome || i?.situacao || i?.situacaoInva?.nome || '').toLowerCase()
      if (sit.includes('clt') && Array.isArray(i.escalas)) {
        const offsetDate = (dateStr, delta) => {
          const [d, m, y] = dateStr.split('/').map(Number)
          const dt = new Date(y, m - 1, d)
          dt.setDate(dt.getDate() + delta)
          return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
        }
        const isFolga = (dateStr) => {
          const [d, m, y] = dateStr.split('/').map(Number)
          const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const s = i.escalas.find(x => x.data.startsWith(target))
          if (!s) return false
          const tn = (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase()
          return tn.includes('folga regular') || tn.includes('folga social')
        }
        let backOffset = -1; let offDaysCount = 0
        while (isFolga(offsetDate(slot.data, backOffset))) { offDaysCount++; backOffset--; if (offDaysCount > 10) break }
        if (offDaysCount > 0) {
          const lastFlightDay = offsetDate(slot.data, backOffset)
          const slotsLastDay = parsedSlots.value.filter(s => s.inva === slot.inva && s.data === lastFlightDay && s.aluno)
          if (slotsLastDay.length > 0) {
            const lastStartTime = Math.max(...slotsLastDay.map(s => hv(s.hora)))
            const restBeforeOff = Math.max(0, 24 - (lastStartTime + 3))
            const effectiveRest = restBeforeOff + hv(slot.hora)
            if (effectiveRest < 12) alerts.push(`Jornada CLT (Pós-Folga): Descanso regulamentar insuficiente. Apenas ${effectiveRest.toFixed(1)}h de repouso efetivo. Requerido 12h totais além das folgas.`)
          }
        }
        let forwardOffset = 1; let futureOffDaysCount = 0
        while (isFolga(offsetDate(slot.data, forwardOffset))) { futureOffDaysCount++; forwardOffset++; if (futureOffDaysCount > 10) break }
        if (futureOffDaysCount > 0) {
          const returnDay = offsetDate(slot.data, forwardOffset)
          const slotsOnReturnDay = parsedSlots.value.filter(s => s.inva === slot.inva && s.data === returnDay && s.aluno)
          if (slotsOnReturnDay.length > 0) {
            const firstStartTime = Math.min(...slotsOnReturnDay.map(s => hv(s.hora)))
            const effectiveRest = Math.max(0, 24 - (hv(slot.hora) + 3)) + firstStartTime
            if (effectiveRest < 12) alerts.push(`Conflito Regulamentar CLT: Esta jornada termina às ${(hv(slot.hora)+3).toFixed(1)}h e o instrutor retorna às ${firstStartTime.toFixed(1)}h no dia ${returnDay}. Repouso de apenas ${effectiveRest.toFixed(1)}h (Mínimo 12h).`)
          }
        }
      }
    }

    // 8. Limite de Jornada Diária (11h) e Descanso entre Dias Comuns (12h)
    if (slot.inva && slot.aluno) {
      const mySlotsToday = SCH.value.filter(s => s.inva === slot.inva && s.aluno).sort((a,b) => hv(a.hora) - hv(b.hora))
      if (mySlotsToday.length > 0) {
        const firstTime = Math.min(...mySlotsToday.map(s => hv(s.hora)))
        const lastTime = Math.max(...mySlotsToday.map(s => hv(s.hora)))
        const journeyEnd = lastTime + 3
        const totalJourney = journeyEnd - firstTime
        if (totalJourney > 11) alerts.push(`Limite de Jornada: Jornada diária totalizando ${totalJourney.toFixed(1)}h (Limite 11h).`)
      }
      const offsetDate = (dateStr, delta) => {
        const [d, m, y] = dateStr.split('/').map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + delta)
        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
      }
      const isFolga = (dateStr) => {
        const i = INVAS.value.find(x => x.nome === slot.inva); if (!i || !Array.isArray(i.escalas)) return false
        const [d, m, y] = dateStr.split('/').map(Number); const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const s = i.escalas.find(x => x.data.startsWith(target)); if (!s) return false
        return (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase().includes('folga')
      }
      const yesterday = offsetDate(slot.data, -1)
      if (!isFolga(yesterday)) {
        const slotsYesterday = parsedSlots.value.filter(s => s.inva === slot.inva && s.data === yesterday && s.aluno)
        if (slotsYesterday.length > 0) {
          const lastTimeYesterday = Math.max(...slotsYesterday.map(s => hv(s.hora))) + 3
          const rest = (24 - lastTimeYesterday) + Math.min(...mySlotsToday.map(s => hv(s.hora)))
          if (rest < 12) alerts.push(`Descanso Insuficiente (Anterior): Apenas ${rest.toFixed(1)}h de repouso desde ontem.`)
        }
      }
      const tomorrow = offsetDate(slot.data, 1)
      if (tomorrow && !isFolga(tomorrow)) {
        const slotsTomorrow = parsedSlots.value.filter(s => s.inva === slot.inva && s.data === tomorrow && s.aluno)
        if (slotsTomorrow.length > 0) {
          const firstTimeTomorrow = Math.min(...slotsTomorrow.map(s => hv(s.hora)))
          const rest = (24 - (Math.max(...mySlotsToday.map(s => hv(s.hora))) + 3)) + firstTimeTomorrow
          if (rest < 12) alerts.push(`Descanso Insuficiente (Próximo): Apenas ${rest.toFixed(1)}h de repouso até amanhã.`)
        }
      }
    }

    // 9. Consecutividade de Instrutor (Diferentes Alunos)
    if (slot.inva && slot.aluno) {
      const myTime = hv(slot.hora)
      const instructorSlotsToday = SCH.value.filter(s => s.inva === slot.inva && s.id !== slot.id && s.aluno && !techImpediments.includes(s.st))
      const prevSlot = instructorSlotsToday.find(s => Math.abs(myTime - hv(s.hora) - 2) < 0.1)
      const nextSlot = instructorSlotsToday.find(s => Math.abs(hv(s.hora) - myTime - 2) < 0.1)

      if (prevSlot && prevSlot.aluno !== slot.aluno) {
        alerts.push(`Troca de Aluno em Sequência: Instrutor possui slot anterior (${prevSlot.hora}) com aluno diferente (${prevSlot.aluno}).`)
      }
      if (nextSlot && nextSlot.aluno !== slot.aluno) {
        alerts.push(`Troca de Aluno em Sequência: Instrutor possui slot seguinte (${nextSlot.hora}) com aluno diferente (${nextSlot.aluno}).`)
      }
    }

    // 10. Missões Especiais e Coordenação
    if (slot.missao) {
      const m = slot.missao.toUpperCase()
      // Regras de Gate Cheque e Extrato SACI
      if (m.includes('AVALIAÇÃO INTERMEDIÁRIA')) {
        alerts.push('Buscar mentor para gate cheque.')
      }
      if (m.includes('AVALIAÇÃO FINAL PARA CHEQUE') || 
          m.includes('AVALIAÇÃO FINAL - CHEQUE SAFE') ||
          (m.includes('AVALIAÇÃO FINAL') && m.includes('PPA'))) {
        alerts.push('Pedir Extrato do SACI em Excel.')
      }

      // Regras de Instrutor Diferente (PS11/PS12 e NAV X1/X2)
      if (m.includes('PS12')) {
        const ps11 = parsedSlots.value.find(s => s.aluno === slot.aluno && s.missao.toUpperCase().includes('PS11'))
        if (ps11 && ps11.inva === slot.inva && slot.inva) {
          alerts.push(`Verifique se o instrutor é diferente da PS11 (Anterior: ${ps11.inva}).`)
        }
      }
      if (m.includes('NAV X2')) {
        const navx1 = parsedSlots.value.find(s => s.aluno === slot.aluno && s.missao.toUpperCase().includes('NAV X1'))
        if (navx1 && navx1.inva === slot.inva && slot.inva) {
          alerts.push(`Verifique se o instrutor é diferente da NAV X1 (Anterior: ${navx1.inva}).`)
        }
      }
    }
    
    return alerts
  }

  return {
    getSlotAlerts,
    getAeronaveHours,
    aeronaveStats
  }
}
