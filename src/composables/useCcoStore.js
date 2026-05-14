import { reactive, computed, shallowRef } from 'vue'
import api from '../services/api'
import { getBase, parseSlotsFromRows, parseWorkSchedulesFromRows } from '../utils/excelParser'
import { useSlotValidation } from './useSlotValidation'
import { useAuth } from './useAuth'

const SESSION_KEY = 'cco_auth'
const TOKEN_KEY = 'cco_token'

const DIAS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORAS_PCATD = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
const HORAS_DEFAULT = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
const ORDEM_BARRAS = [
  'MC-01 (SJK) #1', 'MC01 (SJK) (DIURNO) #2', 
  // 'MC01 - BACKUP #3',
  'SIRA (SJK) #4', 'SM AATD SJK #6',
  'SIM PCATD - SBSJ #5',
  'COLT #11', 'COLT DIURNO #12', 'COLT #12', 'MC01 (CPQ) #13',
  'SIM PCATD - SDAM #8', 'SIM AATD CPQ #10',
]
const BARRAS_CONHECIDAS = [...ORDEM_BARRAS]

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
})

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
  if (!INVAS.value || INVAS.value.length === 0) await fetchInvas()
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
    await fetchInvas()
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

function isBarraConhecida(id) {
  return BARRAS_CONHECIDAS.some((k) => id.toUpperCase().includes(k.toUpperCase()) || k.toUpperCase().includes(id.toUpperCase()))
}

function gerarEditor() {
  const barraMap = {}
  const slotsForDate = parsedSlots.value.filter(s => s.data === state.currentViewDate)
  slotsForDate.forEach((s) => {
    if (!barraMap[s.barra]) barraMap[s.barra] = []
    barraMap[s.barra].push(s)
  })

  state.parsedDate = state.currentViewDate
  const parts = state.parsedDate.split('/')
  if (parts.length >= 3) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
    state.parsedDayName = DIAS_PT[d.getDay()] || ''
  }

  const barrasParaExibir = BARRAS.value
    .filter(b => isBarraConhecida(b.nome))
    .sort((a, b) => {
      const baseA = getBase(a.nome)
      const baseB = getBase(b.nome)
      if (baseA !== baseB) return baseA === 'SJK' ? -1 : 1
      return ordemBarra(a.nome) - ordemBarra(b.nome)
    })

  const schSlots = []
  let sid = 0

  barrasParaExibir.forEach((barraObj) => {
    const barraId = barraObj.nome
    const base = getBase(barraId)
    const existingInBarra = barraMap[barraId] || []
    const byHora = {}
    existingInBarra.forEach((s) => { if (!byHora[s.hora]) byHora[s.hora] = s })

    const isSim = barraId.toUpperCase().includes('PCATD') || 
                  barraId.toUpperCase().includes('AATD') || 
                  barraId.toUpperCase().includes('SM PCATD')
    const gradeBase = isSim ? HORAS_PCATD : HORAS_DEFAULT
    const horasFinais = [...new Set([...gradeBase, ...Object.keys(byHora)])].sort()
    
    horasFinais.forEach((hora) => {
      const existing = byHora[hora]
      sid += 1
      schSlots.push({
        id: `s${sid}`,
        apiId: existing ? (typeof existing.id === 'string' && existing.id.startsWith('api-') ? existing.id.replace('api-', '') : existing.id) : null,
        barra: barraId,
        barraId: existing ? (existing.barraId || barraObj.id) : barraObj.id,
        base,
        hora,
        aluno: existing ? existing.aluno : '',
        alunoId: existing ? existing.alunoId : null,
        inva: existing ? existing.inva : '',
        invaId: existing ? existing.invaId : null,
        ae: existing ? existing.ae : '',
        aeronaveId: existing ? existing.aeronaveId : null,
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

function fetchInvas() {
  const mes = `${state.calendarYear}-${String(state.calendarMonthIdx + 1).padStart(2, '0')}`
  return api.get(`/invas?mes=${mes}`)
    .then(response => {
      INVAS.value = response.data?.data || response.data || []
      return true
    })
    .catch(error => {
      console.error('Error fetching invas:', error)
      return false
    })
}

function fetchAlunos() {
  return api.get('/alunos').then(r => { ALUNOS.value = r.data?.data || r.data; return true })
}
function fetchModelos() {
  return api.get('/modelo-aeronaves').then(r => { MODELOS.value = r.data?.data || r.data; return true })
}
function fetchMissoes() {
  return api.get('/missoes').then(r => { MISSOES.value = r.data?.data || r.data; return true })
}
function fetchRestricoes() {
  return api.get('/restricoes').then(r => { RESTRICTS.value = r.data?.data || r.data; return true })
}

function getWorkScheduleRows(situations, calDays) {
  if (!INVAS.value || INVAS.value.length === 0) return []
  const isSoloSearch = situations.includes('solo')
  const filteredInvas = INVAS.value.filter(i => {
    const sitRaw = i.situacao?.nome || i.situacao || i.situacaoInva?.nome || ''
    const sit = String(sitRaw).toLowerCase().trim()
    if (!sit) return false
    if (isSoloSearch) return sit.includes('solo')
    if (sit.includes('solo')) return false
    return sit.includes('clt') || sit.includes('eventual') || sit.includes('voo')
  })
  
  return filteredInvas.map(instr => {
    let baseNome = 'SJK'
    const rawBase = (instr.base?.nome || instr.base || '').toUpperCase()
    if (rawBase.includes('CPQ') || rawBase.includes('CAMPINAS') || rawBase.includes('SDAM')) baseNome = 'CPQ'
    else if (rawBase.includes('SJK') || rawBase.includes('JOSÉ') || rawBase.includes('SBSJ')) baseNome = 'SJK'

    return {
      nome: instr.nome,
      id: instr.id,
      base: baseNome,
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
    }
  })
}

function fetchBars() { return api.get('/barras').then(r => { BARRAS.value = r.data?.data || r.data; return true }) }

function fetchAeronaves() {
  return api.get('/aeronaves').then(r => { 
    AERONAVES.value = r.data?.data || r.data; 
    return true 
  })
}

async function updateAeronave(id, p) {
  state.globalLoading = true
  try {
    const r = await api.put(`/aeronaves/${id}`, p)
    await fetchAeronaves()
    return { success: true, data: r.data }
  } catch (e) {
    return { success: false, error: e.response?.data?.message || e.message }
  } finally {
    state.globalLoading = false
  }
}

function fetchStatuses() { 
  return api.get('/status-slots').then(r => { 
    STATUSES.value = r.data?.data || r.data; 
    return true 
  }) 
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
      await fetchInvas()
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
          return `${sigla}${s.periodo ? ' - ' + s.periodo : ''}`
        }
      }
    }
    const man = state.availability[n] || 'avail'
    return man === 'avail' ? 'A' : man === 'folga-reg' ? 'FR' : man === 'cond' ? '?' : 'A'
  }

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

  function showAlert(message, title = 'Notificação', type = 'info') {
    state.globalModal.message = message
    state.globalModal.title = title
    state.globalModal.type = type
    state.globalModal.show = true
  }

  function closeAlert() {
    state.globalModal.show = false
  }

  return {
    state, login, logout, checkLogin, onFile, onWorkFile, importScale, importWorkSchedule, fetchSlots, fetchBars, fetchAeronaves, updateAeronave, fetchInvas, fetchStatuses,
    fetchAlunos, fetchModelos, fetchMissoes, fetchRestricoes,
    showAlert, closeAlert,
    setCurrentViewDate: (d) => { state.currentViewDate = d; gerarEditor() },
    generateEditor: gerarEditor,
    voltarUpload: () => { state.fileOk = false; parsedSlots.value = [] },
    resetSchedule: () => { SCH.value = INITIAL.value.map(s => ({ ...s })) },
    toggleDisp: (n) => { 
      const current = availabilityState(n); const states = ['avail', 'folga-reg', 'cond'] 
      const next = states[(states.indexOf(current === 'avail' ? 'avail' : current === 'folga-reg' ? 'folga-reg' : 'cond') + 1) % 3]
      state.availability[n] = next 
    },
    openCalendar: () => fetchInvas(),
    changeCalendarMonth: (delta) => {
      state.calendarMonthIdx += delta
      if (state.calendarMonthIdx > 11) { state.calendarMonthIdx = 0; state.calendarYear += 1 }
      else if (state.calendarMonthIdx < 0) { state.calendarMonthIdx = 11; state.calendarYear -= 1 }
      fetchInvas()
    },
    calendarMonthLabel, calendarFlightRows, calendarSoloRows, calendarDays,
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
    availabilityGroups: computed(() => {
      const g = { SJK: { voo: [], solo: [] }, CPQ: { voo: [], solo: [] } }
      INVAS.value.forEach(i => {
        const b = getBase(i.base?.nome || i.base)
        const sitRaw = i.situacao?.nome || i.situacao || i.situacaoInva?.nome || ''
        const sit = String(sitRaw).toLowerCase()
        if (sit.includes('solo')) g[b].solo.push(i)
        else if (sit.includes('clt') || sit.includes('eventual') || sit.includes('voo')) g[b].voo.push(i)
      })
      return g
    }),
    availabilityState, availabilityClass: (n) => availabilityState(n), availabilityLabel,
    filterStartDate: computed({ get: () => state.filterStartDate, set: (v) => { state.filterStartDate = v } }),
    filterEndDate: computed({ get: () => state.filterEndDate, set: (v) => { state.filterEndDate = v } }),
    currentViewDate: computed(() => state.currentViewDate),
    availableDates: computed(() => state.availableDates),
    scheduleBlocks,
    getInvasByBarra: (barra) => INVAS.value.filter(i => getBase(i.base?.nome || i.base) === getBase(barra)),
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
    saveAvailability: async (p) => { state.globalLoading = true; try { const r = await api.post('/escala-trabalhos', p); await fetchInvas(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    updateAvailability: async (id, p) => { state.globalLoading = true; try { const r = await api.put(`/escala-trabalhos/${id}`, p); await fetchInvas(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    saveRestriction: async (p) => { state.globalLoading = true; try { const r = await api.post('/restricoes', p); await fetchRestricoes(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    importRestrictions: async (restricoes) => {
      state.globalLoading = true
      try {
        const r = await api.post('/restricoes/import', { restricoes })
        await fetchRestricoes()
        return { success: true, data: r.data }
      } catch (e) {
        return { success: false, error: e.response?.data?.message || e.message }
      } finally {
        state.globalLoading = false
      }
    },
    updateRestriction: async (id, p) => { state.globalLoading = true; try { const r = await api.put(`/restricoes/${id}`, p); await fetchRestricoes(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    deleteRestriction: async (id) => { state.globalLoading = true; try { await api.delete(`/restricoes/${id}`); await fetchRestricoes(); return { success: true } } catch (e) { return { success: false, error: e.message } } finally { state.globalLoading = false } },
    saveSlot,
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
    parsedSlots, parsedWorkSchedules, SCH, INITIAL, AERONAVES, BARRAS, INVAS, ALUNOS, MODELOS, MISSOES, RESTRICTS, STATUSES
  }
}
