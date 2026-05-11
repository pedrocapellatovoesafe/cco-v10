import { reactive, computed } from 'vue'
import api from '../services/api'

const SESSION_KEY = 'cco_auth'
const TOKEN_KEY = 'cco_token'

const DIAS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ESTADOS_CAL = ['avail', 'folga', 'cond']
const HORAS_PCATD = ['08:00', '10:00', '14:00', '16:00']
const HORAS_DEFAULT = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
const ORDEM_BARRAS = [
  'MC-01 (SJK) #1', 'MC01 (SJK) (DIURNO) #2', 'MC01 - BACKUP #3',
  'SIRA (SJK) #4', 'SM AATD SJK #6', 'SM PCATD SJK',
  'SIM PCATD - SBSJ #5', 'SIM PCATD SBSJ #5',
  'COLT #11', 'COLT DIURNO #12', 'COLT #12', 'MC01 (CPQ) #13',
  'SIM PCATD - SDAM #8', 'SIM PCATD SDAM', 'SIM AATD CPQ #10',
]
const BARRAS_CONHECIDAS = [...ORDEM_BARRAS]

const AVAIL_TYPES_MAP = {
  'disponivel': 1, 'disponível': 1,
  'folga regular': 2, 'folga social': 3,
  'sobreaviso': 4, 'treinamento': 5,
  'férias': 6, 'ferias': 6,
  'banco de horas': 7, 'operações': 8,
  'trabalho externo': 9, 'dispensa médica': 10,
  'não especificado': 11
}

const state = reactive({
  isAuthenticated: (function() {
    try {
      return !!localStorage.getItem(TOKEN_KEY)
    } catch (e) {
      return false
    }
  })(),
  loginUser: '',
  loginPass: '',
  loginError: false,
  fileName: '',
  fileOk: false,
  parsedSlots: [],
  workFileName: '',
  workFileOk: false,
  parsedWorkSchedules: [],
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
  SCH: [],
  INITIAL: [],
  INST: {},
  AERONAVES: [],
  BARRAS: [],
  INVAS: [],
  ALUNOS: [],
  MODELOS: [],
  MISSOES: [],
  RESTRICTS: [],
  STATUSES: [],
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
})

function login() {
  const payload = {
    email: state.loginUser.trim(),
    password: state.loginPass
  }

  return api.post('/auth/login', payload)
    .then(response => {
      const token = response.data?.token || response.data?.data?.token
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
        sessionStorage.setItem(SESSION_KEY, '1')
        state.isAuthenticated = true
        state.loginError = false
        return true
      }
      state.loginError = true
      return false
    })
    .catch(error => {
      console.error('Login error:', error)
      state.loginError = true
      return false
    })
}

function logout() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  state.isAuthenticated = false
  state.loginUser = ''
  state.loginPass = ''
}

function checkLogin() {
  return state.isAuthenticated
}

function normalizeDate(value) {
  if (!value) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const parts = value.substring(0, 10).replace(/-/g, '/').split('/')
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return value
}

function parseRows(rows) {
  state.parsedSlots = []
  if (!rows.length) return
  const header = rows[0].map((h) => String(h || '').trim().toLowerCase())
  const COLS = {
    aluno: ['aluno', 'aluno/paciente', 'nome do aluno', 'nome aluno'],
    status: ['status'],
    inva: ['inva', 'instrutor', 'instrutor de voo'],
    barra: ['barra', 'aeronave/barra', 'barra/aeronave'],
    data: ['data', 'data do voo', 'data voo'],
    missao: ['missao', 'missão', 'missao/treino', 'missão/treino'],
    horario: ['horario', 'horário', 'hora', 'hora inicio', 'hora início'],
    ae: ['aeronave', 'prefixo'],
    obs: ['obs', 'observação', 'observações'],
  }
  
  const findCol = (h, keys) => {
    for (const k of keys) {
      const idx = h.indexOf(k)
      if (idx >= 0) return idx
    }
    return -1
  }

  const iAluno = findCol(header, COLS.aluno)
  const iStatus = findCol(header, COLS.status)
  const iInva = findCol(header, COLS.inva)
  const iBarra = findCol(header, COLS.barra)
  const iData = findCol(header, COLS.data)
  const iMissao = findCol(header, COLS.missao)
  const iHorario = findCol(header, COLS.horario)
  const iAe = findCol(header, COLS.ae)
  const iObs = findCol(header, COLS.obs)

  const gAluno = iAluno >= 0 ? (r) => String(r[iAluno] || '').trim() : (r) => String(r[0] || '').trim()
  const gStatus = iStatus >= 0 ? (r) => String(r[iStatus] || '').trim().toUpperCase() : (r) => String(r[1] || '').trim().toUpperCase()
  const gInva = iInva >= 0 ? (r) => String(r[iInva] || '').trim() : (r) => String(r[2] || '').trim()
  const gBarra = iBarra >= 0 ? (r) => String(r[iBarra] || '').trim() : (r) => String(r[3] || '').trim()
  const gData = iData >= 0 ? (r) => String(r[iData] || '').trim() : (r) => String(r[5] || '').trim()
  const gMissao = iMissao >= 0 ? (r) => String(r[iMissao] || '').trim() : (r) => String(r[6] || '').trim()
  const gHorario = iHorario >= 0 ? (r) => String(r[iHorario] || '').trim() : (r) => String(r[7] || '').trim()
  const gAe = iAe >= 0 ? (r) => String(r[iAe] || '').trim() : (r) => ''
  const gObs = iObs >= 0 ? (r) => String(r[iObs] || '').trim() : (r) => ''

  state.parsedDate = ''
  state.parsedDayName = ''

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    const aluno = gAluno(row)
    const status = gStatus(row)
    const inva = gInva(row)
    const barra = gBarra(row)
    const data = gData(row)
    const missao = gMissao(row)
    const horario = gHorario(row)
    const ae = gAe(row)
    const obs = gObs(row)

    if (!barra || !horario) continue
    const hm = horario.match(/^(\d{2}:\d{2})/)
    if (!hm) continue
    const hora = hm[1]
    const base = getBase(barra)
    let missaoShort = missao
    if (missao.includes(' > ')) missaoShort = missao.split(' > ').pop().trim()

    if (!state.parsedDate && data) {
      state.parsedDate = normalizeDate(data)
    }

    const slot = { barra, base, hora, aluno, inva, ae, missao: missaoShort, st: status, data, obs }
    state.parsedSlots.push(slot)
  }

  if (state.parsedDate) {
    const parts = state.parsedDate.split('/')
    if (parts.length >= 3) {
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
      state.parsedDayName = DIAS_PT[d.getDay()] || ''
    }
  }
}

function parseWorkScheduleRows(rows) {
  state.parsedWorkSchedules = []
  if (!rows || !rows.length) return
  
  let processedRows = rows
  if (rows[0] && rows[0].length === 1) {
    const line = String(rows[0][0])
    const delim = line.includes(';') ? ';' : line.includes('\t') ? '\t' : line.includes(',') ? ',' : null
    if (delim) {
      processedRows = rows.map(r => String(r[0]).split(delim).map(c => c.trim()))
    }
  }

  const findIdx = (keywords) => {
    for (let i = 0; i < Math.min(3, processedRows.length); i++) {
      const r = processedRows[i].map(c => String(c || '').toLowerCase())
      const idx = r.findIndex(c => keywords.some(k => c.includes(k)))
      if (idx >= 0) return idx
    }
    return -1
  }

  let iTipo = findIdx(['tipo'])
  let iPer = findIdx(['periodo', 'período'])
  let iDias = findIdx(['dias', 'quantidade'])
  let iData = findIdx(['data inicial', 'data', 'inicio'])
  let iFunc = findIdx(['funcionario', 'funcionário', 'instrutor', 'nome'])
  let iMot = findIdx(['motivo', 'obs'])

  if (iData === -1 || iFunc === -1) {
    iTipo = 1; iPer = 2; iDias = 3; iData = 4; iFunc = 5; iMot = 6
  }

  const toDate = (val) => {
    if (!val) return null
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 864e5))
    let s = String(val).trim()
    if (s.includes(' ')) s = s.split(' ')[0]
    if (/^\d{5}$/.test(s)) return new Date(Math.round((parseInt(s, 10) - 25569) * 864e5))
    if (s.includes('/')) {
      const p = s.split('/').map(Number)
      return new Date(p[2] < 100 ? p[2]+2000 : p[2], p[1]-1, p[0])
    }
    if (s.includes('-')) {
      const p = s.split('-')
      if (p[0].length === 4) return new Date(+p[0], +p[1]-1, +p[2])
      return new Date(+p[2], +p[1]-1, +p[0])
    }
    return null
  }

  const startIdx = (iData === 4 && !processedRows[0][4]?.toLowerCase().includes('data')) ? 0 : 1

  for (let i = startIdx; i < processedRows.length; i++) {
    const row = processedRows[i]
    if (!row || row.length < 2) continue
    const rawDataVal = row[iData]
    const rawFunc = String(row[iFunc] || '').trim()
    if (String(rawDataVal).toLowerCase().includes('data') || rawFunc.toLowerCase().includes('func')) continue
    if (!rawDataVal || !rawFunc) continue

    const baseDate = toDate(rawDataVal)
    if (!baseDate || isNaN(baseDate.getTime())) continue

    const norm = (str) => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
    const inva = state.INVAS.find(inv => {
      const db = norm(inv.nome)
      const sh = norm(rawFunc)
      return db === sh || db.includes(sh) || sh.includes(db)
    })
    
    if (!inva) continue

    const rawTipo = String(row[iTipo] || '').toLowerCase()
    let tId = 11
    for (const [k, v] of Object.entries(AVAIL_TYPES_MAP)) { if (rawTipo.includes(k)) { tId = v; break } }

    const rawPer = String(row[iPer] || '').toLowerCase()
    let pCode = 'x'
    if (rawPer.includes('manhã') || rawPer === 'm') pCode = 'm'
    else if (rawPer.includes('tarde') || rawPer === 't') pCode = 't'
    else if (rawPer.includes('noite') || rawPer === 'n') pCode = 'n'

    const num = parseInt(row[iDias] || '1', 10) || 1
    for (let d = 0; d < num; d++) {
      const dt = new Date(baseDate)
      dt.setDate(dt.getDate() + d)
      state.parsedWorkSchedules.push({
        data: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
        periodo: pCode,
        tipoDisponibilidadeId: tId,
        invaId: inva.id,
        motivo: String(row[iMot] || '').trim()
      })
    }
  }
}

function getBase(barraId) {
  const b = String(barraId || '').toUpperCase()
  if (b.includes('CPQ') || b.includes('COLT') || b.includes('SDAM') || b.includes('SIM AATD CPQ')) return 'CPQ'
  if (b.includes('SJK') || b.includes('SIRA') || b.includes('SM AATD SJK') || b.includes('SBSJ')) return 'SJK'
  if (b.includes('BACKUP')) return 'SJK'
  return 'SJK'
}

function onFile(file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      parseRows(rows)
      state.fileName = file.name
      state.fileOk = true
      state.btnGerarDisabled = false
    } catch (err) {
      state.fileOk = false
      alert(`Erro ao ler o arquivo: ${err.message}`)
    }
  }
  reader.readAsArrayBuffer(file)
}

async function onWorkFile(file) {
  if (!file) return
  if (!state.INVAS || state.INVAS.length === 0) await fetchInvas()
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      parseWorkScheduleRows(rows)
      state.workFileName = file.name
      state.workFileOk = true
    } catch (err) {
      state.workFileOk = false
      alert(`Erro ao ler o arquivo de escala: ${err.message}`)
    }
  }
  reader.readAsArrayBuffer(file)
}

async function importScale() {
  state.isUploading = true
  state.uploadError = null
  try {
    const payload = { slots: state.parsedSlots }
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
    const payload = { escalas: state.parsedWorkSchedules }
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
  const slotsForDate = state.parsedSlots.filter(s => s.data === state.currentViewDate)
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

  const barrasParaExibir = state.BARRAS
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

    const isPcatd = barraId.toUpperCase().includes('PCATD') || barraId.toUpperCase().includes('SM PCATD')
    const gradeBase = isPcatd ? HORAS_PCATD : HORAS_DEFAULT
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
        statusSlotId: existing ? existing.statusSlotId : null,
        isChecked: existing ? existing.isChecked : false,
        obs: existing ? existing.obs : '',
        data: state.currentViewDate,
        serverRestrictions: existing ? existing.serverRestrictions : []
      })
    })
  })

  state.INITIAL = schSlots.map((s) => ({ ...s }))
  state.SCH = schSlots.map((s) => ({ ...s }))
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
      state.INVAS = response.data?.data || response.data || []
      return true
    })
    .catch(error => {
      console.error('Error fetching invas:', error)
      return false
    })
}

function fetchAlunos() {
  return api.get('/alunos').then(r => { state.ALUNOS = r.data?.data || r.data; return true })
}
function fetchModelos() {
  return api.get('/modelos-aeronave').then(r => { state.MODELOS = r.data?.data || r.data; return true })
}
function fetchMissoes() {
  return api.get('/missoes').then(r => { state.MISSOES = r.data?.data || r.data; return true })
}
function fetchRestricoes() {
  return api.get('/restricoes').then(r => { state.RESTRICTS = r.data?.data || r.data; return true })
}

function getWorkScheduleRows(situations, calDays) {
  if (!state.INVAS || state.INVAS.length === 0) return []
  const isSoloSearch = situations.includes('solo')
  const filteredInvas = state.INVAS.filter(i => {
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

function fetchBars() { return api.get('/barras').then(r => { state.BARRAS = r.data?.data || r.data; return true }) }
function fetchAeronaves() { return api.get('/aeronaves').then(r => { state.AERONAVES = r.data?.data || r.data; return true }) }
function fetchStatuses() { return api.get('/status-slots').then(r => { state.STATUSES = r.data?.data || r.data; return true }) }

function fetchSlots(startDate, endDate) {
  const params = { startDate: startDate || state.filterStartDate, endDate: endDate || state.filterEndDate }
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

    state.parsedSlots = apiSlots.map(slot => {
      const dt = slot.dataHora ? new Date(slot.dataHora) : new Date()
      
      const raw = []
      if (slot.aluno?.restricoes) raw.push(...slot.aluno.restricoes)
      if (slot.inva?.restricoes) raw.push(...slot.inva.restricoes)
      if (slot.missao?.restricoes) raw.push(...slot.missao.restricoes)
      if (slot.aeronave?.restricoes) raw.push(...slot.aeronave.restricoes)

      const filtered = raw.filter(r => {
        // Truthy check for flags (handles 1/0 or true/false, camel and snake)
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
      filtered.forEach(item => { if (!seen.has(item.id)) { seen.add(item.id); unique.push(item) } })

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
        isChecked: !!slot.isChecked,
        obs: slot.observacoes || '',
        serverRestrictions: unique
      }
    })

    state.availableDates = [...new Set(state.parsedSlots.map(s => s.data))].sort((a,b) => {
      const [da,ma,ya] = a.split('/'); const [db,mb,yb] = b.split('/');
      return new Date(ya,ma-1,da) - new Date(yb,mb-1,db)
    })

    // Auto-select current date if not set or no longer valid
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
    await api.put(`/slots/${slot.apiId}`, buildSlotPayload(slot))
    if (refresh) { 
      await fetchInvas()
      await fetchSlots()
      gerarEditor()
    }
  } catch (error) {
    console.error('Error updating slot:', error)
    alert('Erro ao salvar alteração no servidor.')
  } finally {
    if (refresh) state.globalLoading = false
  }
}

export function useCcoStore() {
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
    const i = state.INVAS.find(x => x.nome === n)
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
    const i = state.INVAS.find(x => x.nome === n)
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

  const getSlotAlerts = (slot) => {
    const alerts = []
    
    // 1. Status da Operação e Impedimentos Técnicos
    const techImpediments = ['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE']
    if (techImpediments.includes(slot.st)) {
      alerts.push(`Impedimento/Status: ${slot.st}`)
    }

    // 2. Observações do Slot
    if (slot.obs && slot.obs.trim()) {
      alerts.push(`Atente-se às observações do slot!`)
    }

    if (!slot.aluno) return alerts

    // 3. Dados Incompletos
    if (!slot.inva || !slot.ae) {
      alerts.push(`Dados Incompletos: Falta preencher ${!slot.inva ? 'Instrutor' : 'Aeronave'}.`)
    }
    
    // 4. Conflito Simultâneo (Instrutor e Aeronave)
    const sameTimeInva = state.SCH.filter(s => s.inva === slot.inva && s.hora === slot.hora && s.id !== slot.id && s.aluno)
    if (sameTimeInva.length > 0) {
      alerts.push(`Conflito Simultâneo: Instrutor já alocado em ${sameTimeInva[0].barra}.`)
    }

    const sameTimeAe = state.SCH.filter(s => s.ae === slot.ae && s.hora === slot.hora && s.id !== slot.id && s.aluno)
    if (sameTimeAe.length > 0) {
      alerts.push(`Conflito de Aeronave: ${slot.ae} já está alocada em ${sameTimeAe[0].barra} neste horário.`)
    }

    // 5. Conflito de Disponibilidade (Escala de Trabalho)
    if (slot.inva) {
      const i = state.INVAS.find(x => x.nome === slot.inva)
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
      const studentSlotsToday = state.SCH.filter(s => s.aluno === slot.aluno).sort((a, b) => hv(a.hora) - hv(b.hora))
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
      const i = state.INVAS.find(x => x.nome === slot.inva)
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
          const slotsLastDay = state.parsedSlots.filter(s => s.inva === slot.inva && s.data === lastFlightDay && s.aluno)
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
          const slotsOnReturnDay = state.parsedSlots.filter(s => s.inva === slot.inva && s.data === returnDay && s.aluno)
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
      const mySlotsToday = state.SCH.filter(s => s.inva === slot.inva && s.aluno).sort((a,b) => hv(a.hora) - hv(b.hora))
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
        const i = state.INVAS.find(x => x.nome === slot.inva); if (!i || !Array.isArray(i.escalas)) return false
        const [d, m, y] = dateStr.split('/').map(Number); const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const s = i.escalas.find(x => x.data.startsWith(target)); if (!s) return false
        return (s.tipoDisponibilidade?.nome || s.tipo || '').toLowerCase().includes('folga')
      }
      const yesterday = offsetDate(slot.data, -1)
      if (!isFolga(yesterday)) {
        const slotsYesterday = state.parsedSlots.filter(s => s.inva === slot.inva && s.data === yesterday && s.aluno)
        if (slotsYesterday.length > 0) {
          const lastTimeYesterday = Math.max(...slotsYesterday.map(s => hv(s.hora))) + 3
          const rest = (24 - lastTimeYesterday) + Math.min(...mySlotsToday.map(s => hv(s.hora)))
          if (rest < 12) alerts.push(`Descanso Insuficiente (Anterior): Apenas ${rest.toFixed(1)}h de repouso desde ontem.`)
        }
      }
      const tomorrow = offsetDate(slot.data, 1)
      if (!isFolga(tomorrow)) {
        const slotsTomorrow = state.parsedSlots.filter(s => s.inva === slot.inva && s.data === tomorrow && s.aluno)
        if (slotsTomorrow.length > 0) {
          const firstTimeTomorrow = Math.min(...slotsTomorrow.map(s => hv(s.hora)))
          const rest = (24 - (Math.max(...mySlotsToday.map(s => hv(s.hora))) + 3)) + firstTimeTomorrow
          if (rest < 12) alerts.push(`Descanso Insuficiente (Próximo): Apenas ${rest.toFixed(1)}h de repouso até amanhã.`)
        }
      }
    }
    return alerts
  }

  const scheduleBlocks = computed(() => {
    const g = { SJK: [], CPQ: [] }
    const barras = [...new Set(state.SCH.map(s => s.barra))]
    barras.forEach(barraId => {
      const slots = state.SCH.filter(s => s.barra === barraId).sort((a,b) => hv(a.hora) - hv(b.hora))
      const base = slots[0]?.base || 'SJK'
      g[base].push({ id: barraId, slots, ae: slots[0]?.ae, modelo: slots[0]?.modelo })
    })
    return g
  })

  return {
    state, login, logout, checkLogin, onFile, onWorkFile, importScale, importWorkSchedule, fetchSlots, fetchBars, fetchAeronaves, fetchInvas, fetchStatuses,
    fetchAlunos, fetchModelos, fetchMissoes, fetchRestricoes,
    setCurrentViewDate: (d) => { state.currentViewDate = d; gerarEditor() },
    generateEditor: gerarEditor,
    voltarUpload: () => { state.fileOk = false; state.parsedSlots = [] },
    resetSchedule: () => { state.SCH = state.INITIAL.map(s => ({ ...s })) },
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
    updateSlotChecked: (id, val) => { const s = state.SCH.find(x => x.id === id); if (s) { s.isChecked = val; updateSlot(s) } },
    updateSlotInstructor: (id, name) => { 
      const s = state.SCH.find(x => x.id === id)
      if (s) { 
        if (name === '-') { s.inva = ''; s.invaId = null } 
        else { s.inva = name; s.invaId = state.INVAS.find(i => i.nome === name)?.id }
        updateSlot(s) 
      } 
    },
    updateSlotStatus: (id, st) => { const s = state.SCH.find(x => x.id === id); if (s) { s.st = st; s.statusSlotId = state.STATUSES.find(x => x.nome === st)?.id; updateSlot(s) } },
    updateSlotAeronave: (id, ae) => { 
      const s = state.SCH.find(x => x.id === id)
      if (s) { 
        if (ae === '-') { s.ae = ''; s.aeronaveId = null } 
        else { s.ae = ae; s.aeronaveId = state.AERONAVES.find(x => x.nome === ae)?.id }
        updateSlot(s) 
      } 
    },
    availabilityGroups: computed(() => {
      const g = { SJK: { voo: [], solo: [] }, CPQ: { voo: [], solo: [] } }
      state.INVAS.forEach(i => {
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
    getInvasByBarra: (barra) => state.INVAS.filter(i => getBase(i.base?.nome || i.base) === getBase(barra)),
    getAeronavesByBarra: (barraNome, currentAe) => {
      const bUpper = (barraNome || '').toUpperCase().trim(); const barraObj = state.BARRAS.find(b => (b.nome || '').toUpperCase().trim() === bUpper)
      let list = state.AERONAVES
      if (barraObj && (barraObj.modeloAeronaveId || barraObj.modeloAeronave?.id)) {
        const mid = barraObj.modeloAeronaveId || barraObj.modeloAeronave?.id
        list = state.AERONAVES.filter(a => a.modeloAeronaveId == mid || a.modeloAeronave?.id == mid)
      } else {
        if (bUpper.includes('PCATD')) list = state.AERONAVES.filter(a => (a.nome || '').toUpperCase().includes('PCATD'))
        else if (bUpper.includes('SIRA')) list = state.AERONAVES.filter(a => (a.nome || '').toUpperCase().includes('SIRA'))
        else if (bUpper.includes('COLT')) list = state.AERONAVES.filter(a => (a.nome || '').toUpperCase().includes('COLT'))
      }
      if (currentAe && !list.find(a => a.nome === currentAe)) {
        const original = state.AERONAVES.find(a => a.nome === currentAe); if (original) list = [original, ...list]
      }
      return list
    },
    deleteSlot: async (id) => { state.globalLoading = true; try { await api.delete(`/slots/${id}`); await fetchSlots(); gerarEditor() } finally { state.globalLoading = false } },
    saveAvailability: async (p) => { state.globalLoading = true; try { const r = await api.post('/escala-trabalhos', p); await fetchInvas(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    updateAvailability: async (id, p) => { state.globalLoading = true; try { const r = await api.put(`/escala-trabalhos/${id}`, p); await fetchInvas(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    saveRestriction: async (p) => { state.globalLoading = true; try { const r = await api.post('/restricoes', p); await fetchRestricoes(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    updateRestriction: async (id, p) => { state.globalLoading = true; try { const r = await api.put(`/restricoes/${id}`, p); await fetchRestricoes(); return { success: true, data: r.data } } catch (e) { return { success: false, error: e.response?.data?.message || e.message } } finally { state.globalLoading = false } },
    deleteRestriction: async (id) => { state.globalLoading = true; try { await api.delete(`/restricoes/${id}`); await fetchRestricoes(); return { success: true } } catch (e) { return { success: false, error: e.message } } finally { state.globalLoading = false } },
    swapSlots: async (idA, idB) => {
      const a = state.SCH.find(x => x.id === idA); const b = state.SCH.find(x => x.id === idB)
      if (!a || !b) return
      const [da, ma, ya] = a.data.split('/'); const coordsA = { dataHora: `${ya}-${ma}-${da} ${a.hora}`, barraId: a.barraId }
      const [db, mb, yb] = b.data.split('/'); const coordsB = { dataHora: `${yb}-${mb}-${db} ${b.hora}`, barraId: b.barraId }
      state.globalLoading = true
      try {
        const tasks = []
        if (a.apiId) tasks.push(api.put(`/slots/${a.apiId}`, buildSlotPayload(a, coordsB)))
        if (b.apiId) tasks.push(api.put(`/slots/${b.apiId}`, buildSlotPayload(b, coordsA)))
        if (tasks.length > 0) { await Promise.all(tasks); await fetchSlots(); gerarEditor() }
      } catch (err) { alert('Erro ao realizar a movimentação no servidor.') } finally { state.globalLoading = false }
    }
  }
}
