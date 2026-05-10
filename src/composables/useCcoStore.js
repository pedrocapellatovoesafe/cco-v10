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
  availSectionVisible: false,
  parsedSlots: [],
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

function findCol(header, keys) {
  for (const key of keys) {
    const idx = header.indexOf(key)
    if (idx >= 0) return idx
  }
  return -1
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

function getBase(barraId) {
  const b = barraId.toUpperCase()
  if (b.includes('CPQ') || b.includes('COLT') || b.includes('SDAM') || b.includes('SIM AATD CPQ')) return 'CPQ'
  if (b.includes('SJK') || b.includes('SIRA') || b.includes('SM AATD SJK') || b.includes('SBSJ')) return 'SJK'
  if (b.includes('BACKUP')) return 'SJK'
  return 'SJK'
}

function normalizeInstructorName(nomeXls, inst) {
  if (!nomeXls) return ''
  const upper = nomeXls.trim().toUpperCase()
  if (inst[upper]) return upper
  for (const nome of Object.keys(inst)) {
    if (upper.startsWith(`${nome} `) || upper === nome) return nome
  }
  return upper
}

function buildInst() {
  const inst = {}
  return inst
}

function buildAvailForm() {
  state.availSectionVisible = true
  state.btnGerarDisabled = false
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
      buildAvailForm()
    } catch (err) {
      state.fileOk = false
      console.error('Erro ao ler o arquivo:', err)
      alert(`Erro ao ler o arquivo: ${err.message}`)
    }
  }
  reader.readAsArrayBuffer(file)
}

async function importScale() {
  state.isUploading = true
  state.uploadError = null
  
  try {
    const payload = {
      slots: state.parsedSlots
    }
    
    const response = await api.post('/slots/import', payload)
    await fetchSlots()
    
    return { success: true, data: response.data }
  } catch (err) {
    console.error('Erro ao importar escala:', err)
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
  state.INST = buildInst()
  const barraMap = {}
  
  const slotsForDate = state.parsedSlots.filter(s => s.data === state.currentViewDate)

  slotsForDate.forEach((s) => {
    if (!barraMap[s.barra]) barraMap[s.barra] = { base: s.base, slots: [] }
    barraMap[s.barra].slots.push(s)
  })

  const barrasOrdenadas = Object.entries(barraMap)
    .filter(([id]) => isBarraConhecida(id))
    .sort((a, b) => {
      if (a[1].base !== b[1].base) return a[1].base === 'SJK' ? -1 : 1
      return ordemBarra(a[0]) - ordemBarra(b[0])
    })

  const schSlots = []
  let sid = 0
  barrasOrdenadas.forEach(([barraId, { base, slots }]) => {
    const byHora = {}
    slots.forEach((s) => {
      if (!byHora[s.hora]) byHora[s.hora] = s
    })
    const isPcatd = barraId.toUpperCase().includes('PCATD') || barraId.toUpperCase().includes('SM PCATD')
    const gradeBase = isPcatd ? HORAS_PCATD : HORAS_DEFAULT
    const horasFinais = [...new Set([...gradeBase, ...Object.keys(byHora)])].sort()
    
    let defaultAe = 'MC01'
    const bu = barraId.toUpperCase()
    if (bu.includes('SIRA')) defaultAe = 'SIRA'
    else if (bu.includes('SM AATD') || bu.includes('SIM AATD')) defaultAe = 'SM AATD'
    else if (bu.includes('PCATD') || bu.includes('SM PCATD') || bu.includes('SIM PCATD')) defaultAe = 'SM PCATD'
    else if (bu.includes('COLT')) defaultAe = 'COLT'

    horasFinais.forEach((hora) => {
      const existing = byHora[hora]
      const invaRaw = existing ? normalizeInstructorName(existing.inva, state.INST) : ''
      const invaClean = invaRaw
      
      let finalAe = existing ? existing.ae : ''
      if (!finalAe && existing?.aeronaveId && state.AERONAVES.length > 0) {
        const found = state.AERONAVES.find(a => a.id === existing.aeronaveId)
        if (found) finalAe = found.nome
      }

      sid += 1
      schSlots.push({
        id: `s${sid}`,
        apiId: existing ? (typeof existing.id === 'string' && existing.id.startsWith('api-') ? existing.id.replace('api-', '') : existing.id) : null,
        barra: barraId,
        barraId: existing ? existing.barraId : null,
        base,
        hora,
        aluno: existing ? existing.aluno : '',
        alunoId: existing ? existing.alunoId : null,
        inva: invaClean,
        invaId: existing ? existing.invaId : null,
        ae: finalAe,
        aeronaveId: existing ? existing.aeronaveId : null,
        modelo: existing ? existing.modelo : defaultAe,
        missao: existing ? existing.missao : '',
        missaoId: existing ? existing.missaoId : null,
        st: existing ? existing.st : '',
        statusSlotId: existing ? existing.statusSlotId : null,
        obs: existing ? existing.obs : '',
        data: state.currentViewDate
      })
    })
  })

  state.INITIAL = schSlots.map((s) => ({ ...s }))
  state.SCH = schSlots.map((s) => ({ ...s }))
  state.highlighted = new Set()
  state.editorTitle = `✈ CCO · Editor de Escala · ${state.parsedDate} · ${state.parsedDayName}`
  state.activeTab = 'SJK'
  state.shuffleLog = ''
}

function clearEditor() {
  state.shuffleLog = ''
  state.SCH = []
  state.INITIAL = []
  state.editorTitle = '✈ CCO · Editor de Escala'
}

function resetSchedule() {
  state.SCH = state.INITIAL.map((s) => ({ ...s }))
  state.highlighted = new Set()
  state.shuffleLog = '↺ Escala restaurada ao estado original.'
}

function hv(hora) {
  const m = hora && hora.match(/^(\d+):(\d+)/)
  return m ? +m[1] + +m[2] / 60 : 0
}

function getSlotClass(slot) {
  const base = 'sc'
  if (!slot.aluno) return `${base} sc-empty`
  return `${base} ${stCls(slot.st)}`
}

function getParsedDateObj(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length < 3) return null
  return new Date(+parts[2], +parts[1] - 1, +parts[0])
}

function getSlotAlerts(slot) {
  const alerts = []
  if (!slot.aluno) return alerts

  if (slot.obs && slot.obs.trim()) {
    alerts.push(`Atente-se às observações do slot!`)
  }

  const techImpediments = ['PENDENTE', 'AGUARDANDO CONFIRMAÇÃO', 'REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE']
  if (techImpediments.includes(slot.st)) {
    alerts.push(`Impedimento/Status: ${slot.st}`)
  }

  if (!slot.inva || !slot.ae) {
    const missing = []
    if (!slot.inva) missing.push('Instrutor')
    if (!slot.ae) missing.push('Aeronave')
    alerts.push(`Dados Incompletos: Falta preencher ${missing.join(' e ')}.`)
  }

  if (slot.inva) {
    const mySlotsToday = state.SCH.filter(s => s.inva === slot.inva && s.aluno).sort((a, b) => hv(a.hora) - hv(b.hora))
    const simultaneous = mySlotsToday.filter(s => s.hora === slot.hora && s.id !== slot.id)
    if (simultaneous.length > 0) {
      alerts.push(`Conflito Simultâneo: Instrutor já alocado em ${simultaneous[0].barra} neste horário.`)
    }

    const slotTime = hv(slot.hora)
    const prev = mySlotsToday.find(s => Math.abs(slotTime - hv(s.hora) - 2) < 0.01)
    const next = mySlotsToday.find(s => Math.abs(hv(s.hora) - slotTime - 2) < 0.01)

    if (prev && prev.aluno !== slot.aluno) {
      alerts.push(`Troca de Aluno: Sequência com aluno diferente (${prev.aluno}) às ${prev.hora}.`)
    }
    if (next && next.aluno !== slot.aluno) {
      alerts.push(`Troca de Aluno: Sequência com aluno diferente (${next.aluno}) às ${next.hora}.`)
    }

    if (mySlotsToday.length > 0) {
      const times = mySlotsToday.map(s => hv(s.hora))
      const first = Math.min(...times)
      const last = Math.max(...times)
      // Regra: 1h antes do primeiro + 1h30 duração + 30min após o último
      // Simplificado: (Last + 2) - (First - 1) = Last - First + 3
      const journey = (last - first) + 3
      if (journey > 11) {
        alerts.push(`Jornada Excedida: Total de ${journey.toFixed(1)}h no dia (limite 11h).`)
      }

      // 6. Regra de Descanso Interjornada (12h entre dias)
      const allMySlots = state.parsedSlots.filter(s => s.inva === slot.inva && s.aluno)
      const currentDate = getParsedDateObj(slot.data)
      const otherDays = [...new Set(allMySlots.map(s => s.data))].filter(d => d !== slot.data)
      
      const otherDaysObjs = otherDays.map(d => ({ str: d, obj: getParsedDateObj(d) }))

      // Look Back: Verificação com o dia anterior
      const prevWorkingDay = otherDaysObjs
        .filter(d => d.obj < currentDate)
        .sort((a, b) => b.obj - a.obj)[0]

      if (prevWorkingDay) {
        const diffDays = (currentDate - prevWorkingDay.obj) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          const mySlotsPrevDay = allMySlots.filter(s => s.data === prevWorkingDay.str)
          const lastTimePrev = Math.max(...mySlotsPrevDay.map(s => hv(s.hora)))
          const firstTimeToday = Math.min(...times)
          const rest = (firstTimeToday - 1 + 24) - (lastTimePrev + 2)
          if (rest < 12) {
            alerts.push(`Descanso Insuficiente (Anterior): Apenas ${rest.toFixed(1)}h de intervalo desde o fim da jornada anterior (limite 12h).`)
          }
        }
      }

      // Look Forward: Verificação com o próximo dia
      const nextWorkingDay = otherDaysObjs
        .filter(d => d.obj > currentDate)
        .sort((a, b) => a.obj - b.obj)[0]

      if (nextWorkingDay) {
        const diffDays = (nextWorkingDay.obj - currentDate) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          const mySlotsNextDay = allMySlots.filter(s => s.data === nextWorkingDay.str)
          const firstTimeNext = Math.min(...mySlotsNextDay.map(s => hv(s.hora)))
          const lastTimeToday = Math.max(...times)
          const rest = (firstTimeNext - 1 + 24) - (lastTimeToday + 2)
          if (rest < 12) {
            alerts.push(`Descanso Insuficiente (Próximo): Apenas ${rest.toFixed(1)}h de intervalo até o início da próxima jornada (limite 12h).`)
          }
        }
      }
    }
  }

  return alerts
}

function stCls(st) {
  if (!st || st === 'CONFIRMADO') return 'sc-filled'
  if (st === 'PENDENTE' || st === 'AGUARDANDO CONFIRMAÇÃO') return 'sc-st-agua'
  return 'sc-st-other'
}

function toggleDisp(nome) {
  const estados = ['avail', 'folga', 'cond']
  const cur = state.availability[nome] || 'avail'
  state.availability[nome] = estados[(estados.indexOf(cur) + 1) % 3]
  state.INST = buildInst()
}

async function updateSlot(slot) {
  console.log('Updating slot:')
  console.log(slot)
  state.globalLoading = true
  try {
    const numericId = slot.apiId
    if (!numericId) {
      console.warn('Cannot update a slot without a valid API ID:', slot.id)
      return
    }

    const inva = state.INVAS.find(i => i.nome === slot.inva)
    const aero = state.AERONAVES.find(a => a.nome === slot.ae)
    const status = state.STATUSES.find(s => s.nome === slot.st)

    const [day, month, year] = slot.data.split('/')
    const dataHora = `${year}-${month}-${day} ${slot.hora}`

    const payload = {
      dataHora: dataHora,
      statusSlotId: status ? status.id : slot.statusSlotId,
      aeronaveId: aero ? aero.id : slot.aeronaveId,
      alunoId: slot.alunoId,
      invaId: inva ? inva.id : slot.invaId,
      missaoId: slot.missaoId,
      barraId: slot.barraId,
      observacoes: slot.obs
    }

    await api.put(`/slots/${numericId}`, payload)
    
    // Refresh all data from server to ensure consistency
    await fetchSlots()
    gerarEditor()
  } catch (error) {
    console.error('Error updating slot:', error)
    alert('Erro ao salvar alteração no servidor. Verifique sua conexão.')
  } finally {
    state.globalLoading = false
  }
}

function updateSlotInstructor(id, value) {
  const slot = state.SCH.find((s) => s.id === id)
  if (slot) {
    slot.inva = value
    updateSlot(slot)
  }
}

function updateSlotStatus(id, value) {
  const slot = state.SCH.find((s) => s.id === id)
  if (slot) {
    slot.st = value
    updateSlot(slot)
  }
}

async function swapSlots(idA, idB) {
  const a = state.SCH.find((s) => s.id === idA)
  const b = state.SCH.find((s) => s.id === idB)
  if (!a || !b) return

  const fields = ['aluno', 'alunoId', 'inva', 'invaId', 'missao', 'missaoId', 'st', 'statusSlotId', 'ae', 'aeronaveId', 'obs']
  const temp = {}
  fields.forEach((key) => { temp[key] = a[key] })
  fields.forEach((key) => { a[key] = b[key] })
  fields.forEach((key) => { b[key] = temp[key] })

  await Promise.all([updateSlot(a), updateSlot(b)])
}

function getTabBlocks(base) {
  const barras = [...new Set(state.SCH.map((slot) => slot.barra))]
    .map((barraId) => {
      const slots = state.SCH.filter((s) => s.barra === barraId).sort((a, b) => hv(a.hora) - hv(b.hora))
      return { id: barraId, base: slots[0]?.base || 'SJK', ae: slots[0]?.ae || '—', modelo: slots[0]?.modelo || '—', slots }
    })
    .filter((block) => block.base === base)
    .sort((a, b) => {
      if (a.base !== b.base) return a.base === 'SJK' ? -1 : 1
      return ordemBarra(a.id) - ordemBarra(b.id)
    })
  return barras
}

const scheduleBlocks = computed(() => ({
  SJK: getTabBlocks('SJK'),
  CPQ: getTabBlocks('CPQ'),
}))

function formatInstructorLabel(nome) {
  return nome.split(' ')[0]
}

function buildCalendarKey(instr, year, month, day) {
  return `${instr.nome}|${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function calendarStorageKey() {
  return `cco_solo_cal_${state.calendarYear}_${state.calendarMonthIdx + 1}`
}

function loadCalendarStorage() {
  try {
    const raw = localStorage.getItem(calendarStorageKey())
    state.calData = raw ? JSON.parse(raw) : {}
  } catch (e) {
    state.calData = {}
  }
}

function saveCalendarStorage() {
  try {
    localStorage.setItem(calendarStorageKey(), JSON.stringify(state.calData))
  } catch (e) {
    console.error('Erro ao salvar calendário', e)
  }
}

const calendarMonthLabel = computed(() => `${MESES_PT[state.calendarMonthIdx]} ${state.calendarYear}`)

const calendarDays = computed(() => {
  const date = new Date(state.calendarYear, state.calendarMonthIdx + 1, 0)
  return Array.from({ length: date.getDate() }, (_, idx) => ({
    day: idx + 1,
    weekDay: DIAS_SEMANA_PT[new Date(state.calendarYear, state.calendarMonthIdx, idx + 1).getDay()],
    isWeekend: [0, 6].includes(new Date(state.calendarYear, state.calendarMonthIdx, idx + 1).getDay()),
    key: idx + 1,
  }))
})

const calendarRows = computed(() => [].map((instr) => ({
  ...instr,
  days: calendarDays.value.map((cell) => {
    const key = buildCalendarKey(instr, state.calendarYear, state.calendarMonthIdx, cell.key)
    const estado = state.calData[key] || (cell.isWeekend ? 'weekend' : 'avail')
    return {
      key,
      estado,
      label: estado === 'avail' ? '✓' : estado === 'folga' ? '✗' : estado === 'cond' ? '?' : '-',
      isToday: new Date().getFullYear() === state.calendarYear && new Date().getMonth() === state.calendarMonthIdx && new Date().getDate() === cell.key,
      isWeekend: cell.isWeekend,
    }
  } )
}))
)

function toggleCalendarDay(key, isWeekend) {
  const current = state.calData[key] || (isWeekend ? 'weekend' : 'avail')
  if (isWeekend) {
    const cycle = ['weekend', 'avail', 'folga', 'cond']
    state.calData[key] = cycle[(cycle.indexOf(current) + 1) % cycle.length]
  } else {
    state.calData[key] = ESTADOS_CAL[(ESTADOS_CAL.indexOf(current) + 1) % ESTADOS_CAL.length]
  }
  saveCalendarStorage()
}

function changeCalendarMonth(delta) {
  state.calendarMonthIdx += delta
  if (state.calendarMonthIdx > 11) {
    state.calendarMonthIdx = 0
    state.calendarYear += 1
  }
  if (state.calendarMonthIdx < 0) {
    state.calendarMonthIdx = 11
    state.calendarYear -= 1
  }
  loadCalendarStorage()
}

function openCalendar() {
  loadCalendarStorage()
}

function closeCalendar() {
  saveCalendarStorage()
}

const availabilityGroups = computed(() => ({
  SJK: { voo: [], solo: [] },
  CPQ: { voo: [], solo: [] },
}))

function availabilityState(nome) {
  return state.availability[nome] || 'avail'
}

function availabilityClass(nome) {
  const estado = availabilityState(nome)
  return estado === 'avail' ? 'ic-ok' : estado === 'folga' ? 'ic-folga' : 'ic-cond'
}

function availabilityLabel(nome) {
  const estado = availabilityState(nome)
  return estado === 'folga' ? '✗' : estado === 'cond' ? '?' : '✓'
}

function voltarUpload() {
  state.fileOk = false
  state.availSectionVisible = false
  state.parsedSlots = []
}

function fetchBars() {
  return api.get('/barras')
    .then(response => {
      const data = response.data?.data || response.data
      state.BARRAS = data.map(b => {
        let modelo = b.modeloAeronave?.nome
        if (!modelo) {
          const bu = b.nome.toUpperCase()
          if (bu.includes('SIRA')) modelo = 'SIRA'
          else if (bu.includes('AATD')) modelo = 'SM AATD'
          else if (bu.includes('PCATD')) modelo = 'SM PCATD'
          else if (bu.includes('COLT')) modelo = 'COLT'
          else modelo = 'MC01'
        }
        return { 
          ...b,
          modeloAeronaveId: b.modeloAeronaveId || b.modeloAeronave?.id,
          modeloAeronave: { 
            ...(b.modeloAeronave || {}), 
            nome: modelo 
          } 
        }
      })
      return true
    })
}

function fetchAeronaves() {
  return api.get('/aeronaves')
    .then(response => {
      state.AERONAVES = response.data?.data || response.data
      return true
    })
}

function fetchInvas() {
  return api.get('/invas')
    .then(response => {
      state.INVAS = response.data?.data || response.data
      return true
    })
    .catch(error => {
      console.error('Error fetching invas:', error)
      return false
    })
}

function fetchStatuses() {
  return api.get('/status-slots')
    .then(response => {
      state.STATUSES = response.data?.data || response.data
      return true
    })
    .catch(error => {
      console.error('Error fetching statuses:', error)
      return false
    })
}

function fetchSlots(startDate, endDate) {
  const sDate = startDate || state.filterStartDate
  const eDate = endDate || state.filterEndDate
  
  const params = {}
  if (sDate) params.startDate = sDate
  if (eDate) params.endDate = eDate

  return api.get('/slots', { params })
    .then(response => {
      const apiSlots = response.data?.data || response.data
      const mappedSlots = apiSlots.map(slot => {
        const dt = slot.dataHora ? new Date(slot.dataHora) : new Date()
        const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        const data = dt.toLocaleDateString('pt-BR')
        
        const barraNome = slot.barra?.nome || ''
        const base = getBase(barraNome)
        
        const inva = slot.inva?.nome || ''
        const missao = slot.missao?.nome || ''
        let missaoShort = missao
        if (missao.includes(' > ')) missaoShort = missao.split(' > ').pop().trim()
        
        return {
          id: `api-${slot.id}`,
          barra: barraNome.trim(),
          barraId: slot.barraId || slot.barra?.id,
          base,
          hora,
          aluno: (slot.aluno?.nome || '').trim(),
          alunoId: slot.alunoId || slot.aluno?.id,
          inva: inva.trim(), 
          invaId: slot.invaId || slot.inva?.id,
          aeronaveId: slot.aeronaveId || slot.aeronave?.id,
          ae: (slot.aeronave?.nome || '').trim(),
          modelo: (slot.aeronave?.modeloAeronave?.nome || '').trim(),
          missao: missaoShort.trim(),
          missaoId: slot.missaoId || slot.missao?.id,
          st: slot.statusSlot?.nome || 'PENDENTE',
          statusSlotId: slot.statusSlotId || slot.statusSlot?.id,
          data,
          obs: (slot.observacoes || slot.observacao || '').trim()
        }
      })

      state.parsedSlots = mappedSlots
      
      const dates = [...new Set(mappedSlots.map(s => s.data))].sort((a, b) => {
        const [da, ma, ya] = a.split('/')
        const [db, mb, yb] = b.split('/')
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db)
      })
      state.availableDates = dates

      if (dates.length > 0) {
        if (!state.currentViewDate || !dates.includes(state.currentViewDate)) {
          state.currentViewDate = dates[0]
        }
        updateParsedDateInfo(state.currentViewDate)
      }
      
      return true
    })
    .catch(error => {
      console.error('Error fetching slots:', error)
      return false
    })
}

function updateParsedDateInfo(dateStr) {
  state.parsedDate = dateStr
  const parts = dateStr.split('/')
  if (parts.length >= 3) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
    state.parsedDayName = DIAS_PT[d.getDay()] || ''
  }
}

function setCurrentViewDate(date) {
  state.currentViewDate = date
  updateParsedDateInfo(date)
  gerarEditor()
}

function getAeronavesByBarra(barraId, currentAe = '') {
  if (!state.BARRAS || !state.BARRAS.length) return state.AERONAVES
  
  const search = (barraId || '').trim().toUpperCase()
  const barra = state.BARRAS.find(b => {
    const nome = (b.nome || '').trim().toUpperCase()
    return nome === search || search.includes(nome) || nome.includes(search)
  })
  
  let list = state.AERONAVES
  // Strictly filter by modeloAeronaveId if both barra and aircraft have it
  if (barra && barra.modeloAeronaveId != null) {
    list = state.AERONAVES.filter(a => a.modeloAeronaveId == barra.modeloAeronaveId)
  } else if (barra && barra.modeloAeronave?.nome) {
    // Fallback to name comparison if IDs are missing
    const modelName = barra.modeloAeronave.nome.toUpperCase()
    list = state.AERONAVES.filter(a => (a.modeloAeronave?.nome || '').toUpperCase() === modelName)
  }

  // Ensure current aircraft is always in the list to prevent empty selections
  if (currentAe) {
    const currentAeUpper = currentAe.trim().toUpperCase()
    if (!list.find(a => (a.nome || '').trim().toUpperCase() === currentAeUpper)) {
      const original = state.AERONAVES.find(a => (a.nome || '').trim().toUpperCase() === currentAeUpper)
      if (original) list = [original, ...list]
    }
  }

  return list.length > 0 ? list : state.AERONAVES
}

function getInvasByBarra(barraId, currentInva = '') {
  if (!state.BARRAS || !state.BARRAS.length) return state.INVAS
  const search = (barraId || '').trim().toUpperCase()
  const barra = state.BARRAS.find(b => {
    const nome = (b.nome || '').trim().toUpperCase()
    return nome === search || search.includes(nome) || nome.includes(search)
  })
  let list = state.INVAS
  if (barra && barra.baseId != null) {
    list = state.INVAS.filter(i => i.baseId == barra.baseId)
  }
  if (currentInva) {
    const currentInvaUpper = currentInva.trim().toUpperCase()
    if (!list.find(i => (i.nome || '').trim().toUpperCase() === currentInvaUpper)) {
      const original = state.INVAS.find(i => (i.nome || '').trim().toUpperCase() === currentInvaUpper)
      if (original) list = [original, ...list]
    }
  }
  return list.length > 0 ? list : state.INVAS
}

function updateSlotAeronave(id, value) {
  const slot = state.SCH.find((s) => s.id === id)
  if (slot) {
    slot.ae = value
    updateSlot(slot)
  }
}

export function useCcoStore() {
  return {
    state,
    login,
    logout,
    checkLogin,
    onFile,
    importScale,
    fetchSlots,
    fetchBars,
    fetchAeronaves,
    fetchInvas,
    fetchStatuses,
    getAeronavesByBarra,
    getInvasByBarra,
    updateSlotAeronave,
    setCurrentViewDate,
    generateEditor: gerarEditor,
    voltarUpload,
    resetSchedule,
    updateSlotInstructor,
    updateSlotStatus,
    toggleDisp,
    openCalendar,
    closeCalendar,
    changeCalendarMonth,
    toggleCalendarDay,
    saveCalendarStorage,
    availabilityGroups,
    availabilityState,
    availabilityClass,
    availabilityLabel,
    scheduleBlocks,
    formatInstructorLabel,
    calendarMonthLabel,
    calendarRows,
    calendarDays,
    getSlotClass,
    getSlotAlerts,
    hv,
    swapSlots,
    activeTab: computed({ get: () => state.activeTab, set: (value) => { state.activeTab = value } }),
    editorTitle: computed(() => state.editorTitle),
    shuffleLog: computed(() => state.shuffleLog),
    fileName: computed(() => state.fileName),
    fileOk: computed(() => state.fileOk),
    availSectionVisible: computed(() => state.availSectionVisible),
    btnGerarDisabled: computed(() => state.btnGerarDisabled),
    parsedDate: computed(() => state.parsedDate),
    parsedDayName: computed(() => state.parsedDayName),
    filterStartDate: computed({ get: () => state.filterStartDate, set: (v) => { state.filterStartDate = v } }),
    filterEndDate: computed({ get: () => state.filterEndDate, set: (v) => { state.filterEndDate = v } }),
    currentViewDate: computed(() => state.currentViewDate),
    availableDates: computed(() => state.availableDates),
  }
}
