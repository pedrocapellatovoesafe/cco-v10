import { reactive, computed, shallowRef } from 'vue'
import api from '../services/api'
import { getBase, parseSlotsFromRows, parseWorkSchedulesFromRows } from '../utils/excelParser'
import { useSlotValidation } from './useSlotValidation'
import { useAuth } from './useAuth'
import { useCcoCatalog } from './useCcoCatalog'
import { useCcoCalendar } from './useCcoCalendar'

const DIAS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ORDEM_BARRAS = [
  'MC-01 (SJK) #1', 'MC01 (SJK) (DIURNO) #2', 
  // 'MC01 - BACKUP #3',
  'SIRA (SJK) #4', 'SM AATD SJK #6',
  'SIM PCATD - SBSJ #5',
  'COLT #11', 'COLT #12', 'MC01 (CPQ) #13',
  'MC01 (CPQ) (DIURNO) #14',
  'SIM PCATD - SDAM #8', 'SIM AATD CPQ #10',
]

// Performance: Use shallowRef for large catalog lists as per INSTRUCOES_IA.md
const parsedSlots = shallowRef([])
const parsedWorkSchedules = shallowRef([])
const SCH = shallowRef([])
const INITIAL = shallowRef([])
const AERONAVES = shallowRef([])
const BARRAS = shallowRef([])
const INVAS = shallowRef([])
const ALUNOS = shallowRef([])
const MODELOS = shallowRef([])
const MISSOES = shallowRef([])
const RESTRICTS = shallowRef([])
const STATUSES = shallowRef([])
const BASES = shallowRef([])
const SITUACOES = shallowRef([])
const CURSOS = shallowRef([])

const auth = useAuth()

const state = reactive({
  isAuthenticated: computed(() => auth.state.isAuthenticated),
  loginUser: '',
  loginPass: '',
  loginError: false,
  fileName: '',
  fileOk: false,
  workFileName: '',
  workFileOk: false,
  parsedDate: '',
  parsedDayName: '',
  availability: {},
  btnGerarDisabled: true,
  activeTab: 'SJK',
  isUploading: false,
  uploadError: null,
  editorTitle: '✈ CCO · Editor de Escala',
  shuffleLog: '',
  calendarYear: new Date().getFullYear(),
  calendarMonthIdx: new Date().getMonth(),
  calData: {},
  INST: {},
  highlighted: new Set(),
  globalLoading: false,
  filterStartDate: (function() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })(),
  filterEndDate: (function() {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })(),
  currentViewDate: '',
  availableDates: [],
  globalModal: {
    show: false,
    title: '',
    message: '',
    type: 'info'
  },
  // Maintain backward compatibility for components using store.state.CATALOG
  // We use computed in reactive to ensure they are always unwrapped and reactive
  parsedSlots: computed(() => parsedSlots.value),
  parsedWorkSchedules: computed(() => parsedWorkSchedules.value),
  SCH: computed(() => SCH.value),
  INITIAL: computed(() => INITIAL.value),
  AERONAVES: computed(() => AERONAVES.value),
  BARRAS: computed(() => BARRAS.value),
  INVAS: computed(() => INVAS.value),
  ALUNOS: computed(() => ALUNOS.value),
  MODELOS: computed(() => MODELOS.value),
  MISSOES: computed(() => MISSOES.value),
  RESTRICTS: computed(() => RESTRICTS.value),
  STATUSES: computed(() => STATUSES.value),
  BASES: computed(() => BASES.value),
  SITUACOES: computed(() => SITUACOES.value),
  CURSOS: computed(() => CURSOS.value),
})

// Initialize Sub-Composables
const refs = { 
  parsedSlots, parsedWorkSchedules, SCH, INITIAL, AERONAVES, BARRAS, 
  INVAS, ALUNOS, MODELOS, MISSOES, RESTRICTS, STATUSES, BASES, SITUACOES, CURSOS 
}
const catalog = useCcoCatalog({ state, refs })
const calendar = useCcoCalendar({ state, refs })

function showAlert(message, title = 'Notificação', type = 'info') {
  state.globalModal.message = message
  state.globalModal.title = title
  state.globalModal.type = type
  state.globalModal.show = true
}

function closeAlert() {
  state.globalModal.show = false
}

function login() {
  auth.state.loginUser = state.loginUser
  auth.state.loginPass = state.loginPass
  return auth.login().then(res => {
    state.loginError = auth.state.loginError
    return res
  })
}

function logout() {
  auth.logout()
  state.loginUser = ''
  state.loginPass = ''
}

function checkLogin() {
  return auth.checkLogin()
}

function onFile(file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      
      const { slots, parsedDate, parsedDayName } = parseSlotsFromRows(rows)
      parsedSlots.value = slots
      state.parsedDate = parsedDate
      state.parsedDayName = parsedDayName

      state.fileName = file.name
      state.fileOk = true
      state.btnGerarDisabled = false
    } catch (err) {
      state.fileOk = false
      showAlert(`Erro ao ler o arquivo: ${err.message}`, 'Erro de Leitura', 'error')
    }
  }
  reader.readAsArrayBuffer(file)
}

async function onWorkFile(file) {
  if (!file) return
  if (!INVAS.value || INVAS.value.length === 0) await catalog.fetchInvas()
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      
      parsedWorkSchedules.value = parseWorkSchedulesFromRows(rows, INVAS.value)
      
      state.workFileName = file.name
      state.workFileOk = true
    } catch (err) {
      state.workFileOk = false
      showAlert(`Erro ao ler o arquivo de escala: ${err.message}`, 'Erro de Leitura', 'error')
    }
  }
  reader.readAsArrayBuffer(file)
}

async function importScale() {
  state.isUploading = true
  state.uploadError = null
  try {
    const payload = { slots: parsedSlots.value }
    const response = await api.post('/slots/import', payload)
    await fetchSlots()
    return { success: true, data: response.data }
  } catch (err) {
    state.uploadError = err.response?.data?.message || err.message
    return { success: false, error: state.uploadError }
  } finally {
    state.isUploading = false
  }
}

async function importWorkSchedule() {
  state.isUploading = true
  state.uploadError = null
  try {
    const payload = { escalas: parsedWorkSchedules.value }
    const response = await api.post('/escala-trabalhos/import', payload)
    await catalog.fetchInvas()
    return { success: true, data: response.data }
  } catch (err) {
    state.uploadError = err.response?.data?.message || err.message
    return { success: false, error: state.uploadError }
  } finally {
    state.isUploading = false
  }
}

function ordemBarra(id) {
  const idx = ORDEM_BARRAS.findIndex((o) => id.toUpperCase().includes(o.toUpperCase()) || o.toUpperCase().includes(id.toUpperCase()))
  if (idx >= 0) return idx
  const m = id.match(/#(\d+)/)
  return m ? 100 + parseInt(m[1], 10) : 999
}

function gerarEditor() {
  const barraMap = {}
  const slotsForDate = parsedSlots.value.filter(s => s.data === state.currentViewDate)
  slotsForDate.forEach((s) => {
    if (!barraMap[s.barraId]) barraMap[s.barraId] = []
    barraMap[s.barraId].push(s)
  })

  state.parsedDate = state.currentViewDate
  const parts = state.parsedDate.split('/')
  if (parts.length >= 3) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
    state.parsedDayName = DIAS_PT[d.getDay()] || ''
  }

  // Get all active bars and sort them by base and then by name/known order
  const barrasParaExibir = BARRAS.value
    .filter(b => b.ativo !== 0) // Ensure bar is active
    .sort((a, b) => {
      const baseA = getBase(a.nome)
      const baseB = getBase(b.nome)
      if (baseA !== baseB) return baseA === 'SJK' ? -1 : 1
      return ordemBarra(a.nome) - ordemBarra(b.nome)
    })

  const schSlots = []
  let sid = 0

  barrasParaExibir.forEach((barraObj) => {
    const barraIdStr = barraObj.nome
    const base = getBase(barraIdStr)
    const existingInBarra = barraMap[barraObj.id] || []
    const byHora = {}
    existingInBarra.forEach((s) => { if (!byHora[s.hora]) byHora[s.hora] = s })

    // Use schedules defined in the API for this bar, filter only active ones
    const activeHorarios = (barraObj.horarios || [])
      .filter(h => h.ativo !== 0)
      .map(h => h.hora.substring(0, 5)) // Ensure HH:mm format
    
    const horasFinais = [...new Set([...activeHorarios, ...Object.keys(byHora)])].sort()
    
    horasFinais.forEach((hora) => {
      const existing = byHora[hora]
      sid += 1
      schSlots.push({
        id: `s${sid}`,
        apiId: existing ? (typeof existing.id === 'string' && existing.id.startsWith('api-') ? existing.id.replace('api-', '') : existing.id) : null,
        barra: barraIdStr,
        barraId: barraObj.id,
        base,
        hora,
        aluno: existing ? existing.aluno : '',
        alunoId: existing ? existing.alunoId : null,
        inva: existing ? existing.inva : '',
        invaId: existing ? existing.invaId : null,
        ae: existing ? existing.ae : '',
        aeronaveId: existing ? existing.aeronaveId : null,
        tipoSimulador: existing ? !!existing.tipoSimulador : false,
        modelo: existing ? existing.modelo : (barraObj.modeloAeronave?.nome || 'MC01'),
        missao: existing ? existing.missao : '',
        missaoId: existing ? existing.missaoId : null,
        st: existing ? existing.st : '',
        statusSlotId: existing ? (existing.statusSlotId || existing.status_slot_id) : null,
        isChecked: existing ? existing.isChecked : false,
        obs: existing ? existing.obs : '',
        data: state.currentViewDate,
        serverRestrictions: existing ? existing.serverRestrictions : []
      })
    })
  })

  INITIAL.value = schSlots.map((s) => ({ ...s }))
  SCH.value = schSlots.map((s) => ({ ...s }))
  state.editorTitle = `✈ CCO · Editor de Escala · ${state.currentViewDate}`
}

function hv(hora) {
  const m = hora && hora.match(/^(\d+):(\d+)/)
  return m ? +m[1] + +m[2] / 60 : 0
}

function fetchSlots(startDate, endDate) {
  const sDate = startDate || (state.filterStartDate?.value || state.filterStartDate)
  const eDate = endDate || (state.filterEndDate?.value || state.filterEndDate)
  const params = { startDate: sDate, endDate: eDate }
  return api.get('/slots', { params }).then(response => {
    const apiSlots = response.data?.data || response.data || []
    
    // Robust ID Extraction Helper
    const getVal = (o, k) => {
      if (!o) return null
      return o[k] ?? o[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] ?? o[k.toLowerCase()] ?? null
    }
    const getInvaId = (o) => getVal(o, 'invaId') || o.inva?.id || null
    const getAlunoId = (o) => getVal(o, 'alunoId') || o.aluno?.id || null
    const getMissaoId = (o) => getVal(o, 'missaoId') || o.missao?.id || null
    const getAeId = (o) => getVal(o, 'aeronaveId') || o.aeronave?.id || null
    const getModId = (o) => getVal(o, 'modeloAeronaveId') || o.modeloAeronave?.id || o.aeronave?.modeloAeronaveId || o.aeronave?.modeloAeronave?.id || null

    parsedSlots.value = apiSlots.map(slot => {
      const dt = slot.dataHora ? new Date(slot.dataHora) : new Date()
      
      const raw = []
      if (slot.aluno?.restricoes) raw.push(...slot.aluno.restricoes)
      if (slot.inva?.restricoes) raw.push(...slot.inva.restricoes)
      if (slot.missao?.restricoes) raw.push(...slot.missao.restricoes)
      if (slot.aeronave?.restricoes) raw.push(...slot.aeronave.restricoes)

      const filtered = raw.filter(r => {
        // Special Case: Night Validation (After 17:00) for "Somente Diurna" Aircraft
        const isNight = dt.getHours() >= 17
        const isSomenteDiurna = (r.nome || '').toUpperCase().includes('SOMENTE DIURNA') || 
                               (r.observacao || '').toUpperCase().includes('SOMENTE DIURNA')
        
        if (isNight && isSomenteDiurna && (r.isAeronave || r.is_aeronave)) {
          // If it's night and it's a "Somente Diurna" restriction for this aircraft, 
          // we force it to show up regardless of other flags (like mission).
          if (String(getAeId(slot)) == String(getAeId(r))) return true
        }

        // Match ALL active flags (Strict Rules)
        const isA = !!(r.isAluno || r.is_aluno)
        const isI = !!(r.isInva || r.is_inva)
        const isAI = !!(r.isAlunoInva || r.is_aluno_inva)
        const isM = !!(r.isMissao || r.is_missao)
        const isAe = !!(r.isAeronave || r.is_aeronave)
        const isMod = !!(r.isModelo || r.is_modelo)

        // Case A: Mandatory Pairing (isAlunoInva)
        // Student A MUST be with INVA B. Alert if Student matches but INVA is WRONG.
        if (isAI) {
          if (String(getAlunoId(slot)) != String(getAlunoId(r))) return false
          if (String(getInvaId(slot)) == String(getInvaId(r))) return false
          return true
        }

        // Case B: Prohibitions (Entity matches ALL specified flags)
        // Rule applies if ALL active flags match the slot entities.
        
        // Special Case: INVA x Modelo (No Mission)
        if (isI && isMod && !isM) {
          if (String(getInvaId(slot)) != String(getInvaId(r))) return false
          const rModId = String(getModId(r))
          const slotAeModId = String(getModId(slot))
          const slotBarModId = String(slot.barra?.modeloAeronaveId || slot.barra?.modeloAeronave?.id || '')
          return (rModId === slotAeModId || rModId === slotBarModId)
        }

        if (isA && String(getAlunoId(slot)) != String(getAlunoId(r))) return false
        if (isI && String(getInvaId(slot)) != String(getInvaId(r))) return false
        if (isM && String(getMissaoId(slot)) != String(getMissaoId(r))) return false
        if (isAe && String(getAeId(slot)) != String(getAeId(r))) return false
        if (isMod && String(getModId(slot)) != String(getModId(r))) return false

        return true
      })

      const unique = []
      const seen = new Set()
      filtered.forEach(item => { 
        if (!seen.has(item.id)) { 
          seen.add(item.id)
          
          // Enhance message for forced night restriction
          const isNight = dt.getHours() >= 17
          const isSomenteDiurna = (item.nome || '').toUpperCase().includes('SOMENTE DIURNA') || 
                                 (item.observacao || '').toUpperCase().includes('SOMENTE DIURNA')
          
          if (isNight && isSomenteDiurna) {
            unique.push({
              ...item,
              nome: `🚫 [NOTURNO] ${item.nome}`,
              observacao: `IMPEDIMENTO: Esta aeronave possui restrição 'Somente Diurna'. Slots a partir das 17:00 são considerados noturnos e proibidos para este prefixo.`
            })
          } else {
            unique.push(item)
          }
        } 
      })

      return {
        id: `api-${slot.id}`,
        apiId: slot.id,
        barra: slot.barra?.nome || '',
        barraId: slot.barraId || slot.barra?.id,
        base: getBase(slot.barra?.nome),
        hora: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data: dt.toLocaleDateString('pt-BR'),
        aluno: slot.aluno?.nome || '',
        alunoId: getAlunoId(slot),
        inva: slot.inva?.nome || '',
        invaId: getInvaId(slot),
        ae: slot.aeronave?.nome || '',
        aeronaveId: getAeId(slot),
        tipoSimulador: slot.aeronave ? !!slot.aeronave.tipoSimulador : false,
        modelo: slot.aeronave?.modeloAeronave?.nome || '',
        modeloId: getModId(slot),
        missao: (slot.missao?.nome || '').split(' > ').pop(),
        missaoId: getMissaoId(slot),
        st: (slot.statusSlot?.nome || 'PENDENTE').toUpperCase(),
        statusSlotId: getVal(slot, 'statusSlotId') || slot.statusSlot?.id || null,
        isChecked: !!slot.isChecked,
        obs: slot.observacoes || '',
        serverRestrictions: unique
      }
    })

    state.availableDates = [...new Set(parsedSlots.value.map(s => s.data))].sort((a,b) => {
      const [da,ma,ya] = a.split('/'); const [db,mb,yb] = b.split('/');
      return new Date(ya,ma-1,da) - new Date(yb,mb-1,db)
    })

    if (state.availableDates.length > 0) {
      if (!state.currentViewDate || !state.availableDates.includes(state.currentViewDate)) {
        state.currentViewDate = state.availableDates[0]
      }
    }
    
    return true
  })
}

function buildSlotPayload(slot, overrideCoords = null) {
  const [day, month, year] = slot.data.split('/')
  const dataHora = overrideCoords ? overrideCoords.dataHora : `${year}-${month}-${day} ${slot.hora}`
  const barraId = overrideCoords ? overrideCoords.barraId : slot.barraId
  return {
    dataHora,
    statusSlotId: slot.statusSlotId,
    aeronaveId: slot.aeronaveId,
    alunoId: slot.alunoId,
    invaId: slot.invaId,
    missaoId: slot.missaoId,
    barraId,
    isChecked: !!slot.isChecked,
    observacoes: slot.obs || ''
  }
}

async function updateSlot(slot, refresh = true) {
  state.globalLoading = true
  try {
    if (!slot.apiId) return
    const payload = buildSlotPayload(slot)
    await api.put(`/slots/${slot.apiId}`, payload)
    if (refresh) { 
      await catalog.fetchInvas()
      await fetchSlots()
      gerarEditor()
    }
  } catch (error) {
    console.error('Error updating slot:', error)
    showAlert('Erro ao salvar alteração no servidor.', 'Erro de Sincronização', 'error')
  } finally {
    if (refresh) state.globalLoading = false
  }
}

async function saveSlot(slot) {
  state.globalLoading = true
  try {
    const payload = buildSlotPayload(slot)
    const r = await api.post('/slots', payload)
    await fetchSlots()
    gerarEditor()
    return { success: true, data: r.data }
  } catch (error) {
    console.error('Error saving slot:', error)
    return { success: false, error: error.response?.data?.message || error.message }
  } finally {
    state.globalLoading = false
  }
}

export function useCcoStore() {
  const { getSlotAlerts, getAeronaveHours, aeronaveStats } = useSlotValidation(SCH, INVAS, AERONAVES, parsedSlots)

  const scheduleBlocks = computed(() => {
    const g = { SJK: [], CPQ: [] }
    const barras = [...new Set(SCH.value.map(s => s.barra))]
    barras.forEach(barraId => {
      const slots = SCH.value.filter(s => s.barra === barraId).sort((a,b) => hv(a.hora) - hv(b.hora))
      const base = slots[0]?.base || 'SJK'
      g[base].push({ id: barraId, slots, ae: slots[0]?.ae, modelo: slots[0]?.modelo })
    })
    return g
  })

  const getAeronaveHoursClass = (hours) => {
    const h = parseFloat(hours || 0)
    if (h <= 5) return 'low'
    if (h <= 15) return 'mid'
    return 'high'
  }

  return {
    state, login, logout, checkLogin, onFile, onWorkFile, importScale, importWorkSchedule, fetchSlots, 
    ...catalog,
    ...calendar,
    showAlert, closeAlert,
    setCurrentViewDate: (d) => { state.currentViewDate = d; gerarEditor() },
    generateEditor: gerarEditor,
    voltarUpload: () => { state.fileOk = false; parsedSlots.value = [] },
    resetSchedule: () => { SCH.value = INITIAL.value.map(s => ({ ...s })) },
    openCalendar: () => catalog.fetchInvas(),
    changeCalendarMonth: (delta) => {
      state.calendarMonthIdx += delta
      if (state.calendarMonthIdx > 11) { state.calendarMonthIdx = 0; state.calendarYear += 1 }
      else if (state.calendarMonthIdx < 0) { state.calendarMonthIdx = 11; state.calendarYear -= 1 }
      catalog.fetchInvas()
    },
    getSlotClass: (s) => !s.aluno ? 'sc sc-empty' : `sc ${s.st === 'CONFIRMADO' ? 'sc-filled' : s.st === 'PENDENTE' ? 'sc-st-agua' : 'sc-st-other'}`,
    getSlotAlerts,
    aeronaveStats,
    getAeronaveHours,
    getAeronaveHoursClass,
    updateSlotChecked: (id, val) => { const s = SCH.value.find(x => x.id === id); if (s) { s.isChecked = val; updateSlot(s) } },
    updateSlotInstructor: (id, name) => { 
      const s = SCH.value.find(x => x.id === id)
      if (s) { 
        if (!name || name === '-' || name === '—') { s.inva = ''; s.invaId = null } 
        else { s.inva = name; s.invaId = INVAS.value.find(i => i.nome === name)?.id || null }
        updateSlot(s) 
      } 
    },
    updateSlotStatus: (id, st) => { 
      const s = SCH.value.find(x => x.id === id)
      if (s) { 
        if (!st || st === '-' || st === '—') { s.st = ''; s.statusSlotId = null }
        else { s.st = st; s.statusSlotId = STATUSES.value.find(x => x.nome.toUpperCase() === st.toUpperCase())?.id || null }
        updateSlot(s) 
      } 
    },
    updateSlotAeronave: (id, ae) => { 
      const s = SCH.value.find(x => x.id === id)
      if (s) { 
        if (!ae || ae === '-' || ae === '—') { s.ae = ''; s.aeronaveId = null } 
        else { s.ae = ae; s.aeronaveId = AERONAVES.value.find(x => x.nome === ae)?.id || null }
        updateSlot(s) 
      } 
    },
    availabilityGroups: calendar.availabilityGroups,
    availabilityState: calendar.availabilityState,
    availabilityClass: (n) => calendar.availabilityState(n),
    availabilityLabel: calendar.availabilityLabel,
    filterStartDate: computed({ get: () => state.filterStartDate, set: (v) => { state.filterStartDate = v } }),
    filterEndDate: computed({ get: () => state.filterEndDate, set: (v) => { state.filterEndDate = v } }),
    currentViewDate: computed(() => state.currentViewDate),
    availableDates: computed(() => state.availableDates),
    scheduleBlocks,
    getInvasByBarra: (barra, currentInvaName) => {
      const bUpper = (barra || '').toUpperCase().trim()
      const barraObj = BARRAS.value.find(b => (b.nome || '').toUpperCase().trim() === bUpper)
      
      let list = []
      if (barraObj && Array.isArray(barraObj.invas)) {
        const configuredIds = barraObj.invas.map(i => i.id)
        list = INVAS.value.filter(i => configuredIds.includes(i.id))
      } else {
        list = INVAS.value.filter(i => {
          const isChecador = (i.situacaoInvaId === 5 || i.situacao_inva_id === 5)
          if (isChecador) return true
          return getBase(i.base?.nome || i.base) === getBase(barra)
        })
      }
      
      if (currentInvaName) {
        const currentInva = INVAS.value.find(i => i.nome === currentInvaName)
        if (currentInva && !list.find(i => i.id === currentInva.id)) {
          list = [currentInva, ...list]
        }
      }
      
      return list
    },
    getAeronavesByBarra: (barraNome, currentAe) => {
      const bUpper = (barraNome || '').toUpperCase().trim(); const barraObj = BARRAS.value.find(b => (b.nome || '').toUpperCase().trim() === bUpper)
      let list = AERONAVES.value
      if (barraObj && (barraObj.modeloAeronaveId || barraObj.modeloAeronave?.id)) {
        const mid = barraObj.modeloAeronaveId || barraObj.modeloAeronave?.id
        list = AERONAVES.value.filter(a => a.modeloAeronaveId == mid || a.modeloAeronave?.id == mid)
      } else {
        if (bUpper.includes('PCATD')) list = AERONAVES.value.filter(a => (a.nome || '').toUpperCase().includes('PCATD'))
        else if (bUpper.includes('SIRA')) list = AERONAVES.value.filter(a => (a.nome || '').toUpperCase().includes('SIRA'))
        else if (bUpper.includes('COLT')) list = AERONAVES.value.filter(a => (a.nome || '').toUpperCase().includes('COLT'))
      }
      if (currentAe && !list.find(a => a.nome === currentAe)) {
        const original = AERONAVES.value.find(a => a.nome === currentAe); if (original) list = [original, ...list]
      }
      return list
    },
    deleteSlot: async (id) => { state.globalLoading = true; try { await api.delete(`/slots/${id}`); await fetchSlots(); gerarEditor() } finally { state.globalLoading = false } },
    saveSlot,
    updateSlot,
    swapSlots: async (idA, idB) => {
      const a = SCH.value.find(x => x.id === idA); const b = SCH.value.find(x => x.id === idB)
      if (!a || !b) return
      const [da, ma, ya] = a.data.split('/'); const coordsA = { dataHora: `${ya}-${ma}-${da} ${a.hora}`, barraId: a.barraId }
      const [db, mb, yb] = b.data.split('/'); const coordsB = { dataHora: `${yb}-${mb}-${db} ${b.hora}`, barraId: b.barraId }
      state.globalLoading = true
      try {
        const tasks = []
        if (a.apiId) tasks.push(api.put(`/slots/${a.apiId}`, buildSlotPayload(a, coordsB)))
        if (b.apiId) tasks.push(api.put(`/slots/${b.apiId}`, buildSlotPayload(b, coordsA)))
        if (tasks.length > 0) { await Promise.all(tasks); await fetchSlots(); gerarEditor() }
      } catch (err) { showAlert('Erro ao realizar a movimentação no servidor.', 'Erro de Movimentação', 'error') } finally { state.globalLoading = false }
    },
    // Explicitly export refs for external access
    parsedSlots, parsedWorkSchedules, SCH, INITIAL, AERONAVES, BARRAS, INVAS, ALUNOS, MODELOS, MISSOES, RESTRICTS, STATUSES, BASES, SITUACOES, CURSOS
  }
}
