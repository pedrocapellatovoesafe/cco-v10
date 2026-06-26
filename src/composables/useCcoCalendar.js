import { computed } from 'vue'
import { getBase } from '../utils/excelParser'

/**
 * Composable for managing calendar and availability logic.
 */
export function useCcoCalendar({ state, refs }) {
  const { INVAS } = refs

  const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  function getWorkScheduleRows(situations, calDays) {
    if (!INVAS.value || INVAS.value.length === 0) return []
    const isSoloSearch = situations.includes('solo')
    const filteredInvas = INVAS.value.filter(i => {
      const sitRaw = i.situacao?.nome || i.situacao || i.situacaoInva?.nome || ''
      const sit = String(sitRaw).toLowerCase().trim()
      if (!sit) return false
      if (isSoloSearch) return sit.includes('solo')
      if (sit.includes('solo')) return false
      return sit.includes('clt') || sit.includes('eventual') || sit.includes('voo') || sit.includes('checador')
    })
    
    return filteredInvas.flatMap(instr => {
      let baseNome = 'SJK'
      const rawBase = (instr.base?.nome || instr.base || '').toUpperCase()
      if (rawBase.includes('CPQ') || rawBase.includes('CAMPINAS') || rawBase.includes('SDAM')) baseNome = 'CPQ'
      else if (rawBase.includes('SJK') || rawBase.includes('JOSÉ') || rawBase.includes('SBSJ')) baseNome = 'SJK'

      // No special exception for bases: checador only appears in their registered base
      const bases = [baseNome]

      return bases.map(b => ({
        nome: instr.nome,
        id: instr.id,
        base: b,
        days: calDays.map(cell => {
          const year = state.calendarYear
          const month = String(state.calendarMonthIdx + 1).padStart(2, '0')
          const day = String(cell.day).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          const schedule = Array.isArray(instr.escalas) ? instr.escalas.find(s => s.data && s.data.startsWith(dateStr)) : null
          
          let estado = 'avail'
          let sigla = 'A'
          let periodo = ''

          if (schedule) {
            const tipoNome = (schedule.tipoDisponibilidade?.nome || schedule.tipo || '').toLowerCase()
            periodo = schedule.periodo || ''
            
            if (tipoNome.includes('disponivel') || tipoNome.includes('disponível')) { estado = 'avail'; sigla = '✓' }
            else if (tipoNome.includes('folga regular')) { estado = 'folga-reg'; sigla = 'FR' }
            else if (tipoNome.includes('folga social')) { estado = 'folga-soc'; sigla = 'FS' }
            else if (tipoNome.includes('sobreaviso')) { estado = 'sobreaviso'; sigla = 'SA' }
            else if (tipoNome.includes('treinamento')) { estado = 'treinamento'; sigla = 'TR' }
            else if (tipoNome.includes('férias') || tipoNome.includes('ferias')) { estado = 'ferias'; sigla = 'FE' }
            else if (tipoNome.includes('banco')) { estado = 'banco'; sigla = 'BH' }
            else if (tipoNome.includes('opera')) { estado = 'operacoes'; sigla = 'OP' }
            else if (tipoNome.includes('externo')) { estado = 'externo'; sigla = 'TE' }
            else if (tipoNome.includes('médica') || tipoNome.includes('medica') || tipoNome.includes('dispensa')) { estado = 'medica'; sigla = 'DM' }
            else if (tipoNome.includes('acionado')) { estado = 'acionado'; sigla = 'AC' }
            else { estado = 'outro'; sigla = '?' }
          } else if (cell.isWeekend) { 
            estado = 'weekend-avail'
            sigla = 'A'
          }

          return { 
            key: cell.day, 
            estado, 
            sigla,
            periodo,
            label: sigla + (periodo ? ` - ${periodo}` : ''), 
            isToday: new Date().getFullYear() === state.calendarYear && new Date().getMonth() === state.calendarMonthIdx && new Date().getDate() === cell.day, 
            isWeekend: cell.isWeekend 
          }
        })
      }))
    })
  }

  const calendarDays = computed(() => {
    const date = new Date(state.calendarYear, state.calendarMonthIdx + 1, 0)
    return Array.from({ length: date.getDate() }, (_, idx) => ({
      day: idx + 1,
      weekDay: DIAS_SEMANA_PT[new Date(state.calendarYear, state.calendarMonthIdx, idx + 1).getDay()],
      isWeekend: [0, 6].includes(new Date(state.calendarYear, state.calendarMonthIdx, idx + 1).getDay()),
      key: idx + 1
    }))
  })

  const calendarFlightRows = computed(() => getWorkScheduleRows(['clt', 'eventual', 'voo'], calendarDays.value))
  const calendarSoloRows = computed(() => getWorkScheduleRows(['solo'], calendarDays.value))
  const calendarMonthLabel = computed(() => `${MESES_PT[state.calendarMonthIdx]} ${state.calendarYear}`)

  const availabilityState = (n) => {
    const i = INVAS.value.find(x => x.nome === n)
    if (i) {
      const dParts = state.currentViewDate.split('/')
      if (dParts.length === 3) {
        const dStr = `${dParts[2]}-${dParts[1]}-${dParts[0]}`
        const s = Array.isArray(i.escalas) ? i.escalas.find(x => x.data.startsWith(dStr)) : null
        if (s) {
          const tipoNome = (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase()
          if (tipoNome.includes('disponivel') || tipoNome.includes('disponível')) return 'avail'
          if (tipoNome.includes('folga regular')) return 'folga-reg'
          if (tipoNome.includes('folga social')) return 'folga-soc'
          if (tipoNome.includes('sobreaviso')) return 'sobreaviso'
          if (tipoNome.includes('treinamento')) return 'treinamento'
          if (tipoNome.includes('férias') || tipoNome.includes('ferias')) return 'ferias'
          if (tipoNome.includes('banco')) return 'banco'
          if (tipoNome.includes('opera')) return 'operacoes'
          if (tipoNome.includes('externo')) return 'externo'
          if (tipoNome.includes('médica') || tipoNome.includes('medica')) return 'medica'
          if (tipoNome.includes('acionado')) return 'acionado'
          return 'outro'
        }
      }
    }
    return state.availability[n] || 'avail'
  }

  const availabilityLabel = (n) => {
    const i = INVAS.value.find(x => x.nome === n)
    if (i) {
      const dParts = state.currentViewDate.split('/')
      if (dParts.length === 3) {
        const dStr = `${dParts[2]}-${dParts[1]}-${dParts[0]}`
        const s = Array.isArray(i.escalas) ? i.escalas.find(x => x.data.startsWith(dStr)) : null
        if (s) {
          const tipoNome = (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase()
          let sigla = '?'
          if (tipoNome.includes('disponivel') || tipoNome.includes('disponível')) sigla = '✓'
          else if (tipoNome.includes('folga regular')) sigla = 'FR'
          else if (tipoNome.includes('folga social')) sigla = 'FS'
          else if (tipoNome.includes('sobreaviso')) sigla = 'SA'
          else if (tipoNome.includes('treinamento')) sigla = 'TR'
          else if (tipoNome.includes('férias') || tipoNome.includes('ferias')) sigla = 'FE'
          else if (tipoNome.includes('banco')) sigla = 'BH'
          else if (tipoNome.includes('opera')) sigla = 'OP'
          else if (tipoNome.includes('externo')) sigla = 'TE'
          else if (tipoNome.includes('médica') || tipoNome.includes('medica')) sigla = 'DM'
          else if (tipoNome.includes('acionado')) sigla = 'AC'
          return `${sigla}${s.periodo ? ' - ' + s.periodo : ''}`
        }
      }
    }
    const man = state.availability[n] || 'avail'
    return man === 'avail' ? 'A' : man === 'folga-reg' ? 'FR' : man === 'cond' ? '?' : 'A'
  }

  const availabilityGroups = computed(() => {
    const g = { SJK: { voo: [], solo: [] }, CPQ: { voo: [], solo: [] } }
    INVAS.value.forEach(i => {
      const b = getBase(i.base?.nome || i.base)
      const sitRaw = i.situacao?.nome || i.situacao || i.situacaoInva?.nome || ''
      const sit = String(sitRaw).toLowerCase()
      
      // No special exception for bases: checador only appears in their registered base
      const targets = [b]
      
      targets.forEach(targetBase => {
        if (sit.includes('solo')) g[targetBase].solo.push(i)
        else if (sit.includes('clt') || sit.includes('eventual') || sit.includes('voo') || sit.includes('checador')) g[targetBase].voo.push(i)
      })
    })
    return g
  })

  function toggleDisp(n) { 
    const current = availabilityState(n)
    const states = ['avail', 'folga-reg', 'cond'] 
    const next = states[(states.indexOf(current === 'avail' ? 'avail' : current === 'folga-reg' ? 'folga-reg' : 'cond') + 1) % 3]
    state.availability[n] = next 
  }

  return {
    calendarDays,
    calendarFlightRows,
    calendarSoloRows,
    calendarMonthLabel,
    availabilityGroups,
    availabilityState,
    availabilityLabel,
    toggleDisp
  }
}
