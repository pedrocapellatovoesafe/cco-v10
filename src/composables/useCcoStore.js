import { reactive, computed } from 'vue'

const USER_EMAIL = 'cco@voesafe.com.br'
const USER_PASSWORD = 'SafeCCO123$'
const SESSION_KEY = 'cco_auth'

const QUADRO = {
  SJK: [
    { nome: 'KEVIN ARAÚJO WAJIMA', tipo: 'clt_full', auth: ['MC01', 'SIRA', 'SM_AATD_SJK'] },
    { nome: 'DIEGO SOARES GONÇALVES', tipo: 'clt_full', auth: ['MC01', 'SM_AATD_SJK'] },
    { nome: 'DALAQUA', tipo: 'clt_part', auth: ['MC01', 'SM_AATD_SJK'] },
    { nome: 'DANILO LIRA SILVEIRA', tipo: 'eventual_livre', auth: ['MC01', 'SM_AATD_SJK', 'PCATD_SJK'] },
    { nome: 'KLEBER RICARDO DE MIRANDA', tipo: 'eventual_livre', auth: ['MC01', 'SIRA'] },
    { nome: 'VIVIAN XAVIER CAVALCANTE', tipo: 'eventual_livre', auth: ['MC01', 'SM_AATD_SJK'] },
    { nome: 'BERNARDO BANDEIRA', tipo: 'eventual_rest', auth: ['MC01'] },
    { nome: 'ISABELA GARCIA', tipo: 'eventual_rest', auth: ['MC01'] },
    { nome: 'DANIEL BRUM', tipo: 'eventual_rest', auth: ['MC01'] },
    { nome: 'MAYSON DE VICENTE DOS SANTOS', tipo: 'eventual_rest', auth: ['MC01'] },
    { nome: 'LUAN SANTANA', tipo: 'eventual_rest', auth: ['MC01'] },
    { nome: 'CAIQUE DUARTE', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'RODRIGO NASCIMENTO', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'RODRIGO MELO', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'PEDRO LUCAS', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'EDUARDO RAHMAN', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'VICTOR DE PINHO', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'ERIK SUZUKI', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
    { nome: 'WILLARD QUEIROZ', tipo: 'solo_sjk', auth: ['PCATD_SJK'] },
  ],
  CPQ: [
    { nome: 'ABBEGG', tipo: 'clt_full', auth: ['COLT', 'SM_AATD_CPQ', 'PCATD_CPQ'] },
    { nome: 'IGOR', tipo: 'clt_part', auth: ['COLT', 'SM_AATD_CPQ'] },
    { nome: 'PEDRO SALES', tipo: 'clt_part', auth: ['COLT', 'SM_AATD_CPQ'] },
    { nome: 'LANY', tipo: 'eventual_rest', auth: ['COLT'] },
    { nome: 'EDUARDO GEVINSKI', tipo: 'eventual_rest', auth: ['COLT'] },
    { nome: 'IAN FRANCISCO GAIECKI OLIVEIRA', tipo: 'eventual_rest', auth: ['COLT'] },
    { nome: 'JOSÉ FELIPE DE CAMARGO BARROS NETO', tipo: 'eventual_rest', auth: ['COLT'] },
    { nome: 'LUIZ QUAGLIA', tipo: 'eventual_rest', auth: ['COLT'] },
    { nome: 'STEPHANIE BRUNO', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
    { nome: 'THEO SILVA', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
    { nome: 'JHONY BINATTO', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
    { nome: 'BERNARDO FERREIRA', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
    { nome: 'GABRIEL ANDRADE', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
    { nome: 'GABRIEL COMARELLA', tipo: 'solo_cpq', auth: ['PCATD_CPQ'] },
  ],
}

const SOLO_INSTRUTORES = [
  { nome: 'CAIQUE DUARTE', base: 'SJK' },
  { nome: 'RODRIGO NASCIMENTO', base: 'SJK' },
  { nome: 'RODRIGO MELO', base: 'SJK' },
  { nome: 'PEDRO LUCAS', base: 'SJK' },
  { nome: 'EDUARDO RAHMAN', base: 'SJK' },
  { nome: 'VICTOR DE PINHO', base: 'SJK' },
  { nome: 'ERIK SUZUKI', base: 'SJK' },
  { nome: 'WILLARD QUEIROZ', base: 'SJK' },
  { nome: 'STEPHANIE BRUNO', base: 'CPQ' },
  { nome: 'THEO SILVA', base: 'CPQ' },
  { nome: 'JHONY BINATTO', base: 'CPQ' },
  { nome: 'BERNARDO FERREIRA', base: 'CPQ' },
  { nome: 'GABRIEL ANDRADE', base: 'CPQ' },
]

const LAB_AUTH = new Set([
  'KEVIN ARAÚJO WAJIMA',
  'DANILO LIRA SILVEIRA',
  'VIVIAN XAVIER CAVALCANTE',
  'DIEGO SOARES GONÇALVES',
  'PEDRO SALES',
  'EDUARDO GEVINSKI',
  'IGOR',
  'ABBEGG',
])

const ERR_CODES = new Set(['FOLGA', 'BARRA', 'NO_INSTR', 'JORNADA', 'SIMULT', 'LAB', 'MISSAO_REST'])

const MISSOES_EVENTUAL_PERMITIDAS = new Set([
  'PS01', 'PS02', 'PS03', 'PS07', 'PS08', 'PS13',
  'AP01', 'AP02', 'AP03', 'AP05',
  'NOT01',
  'NAV01', 'NAV03', 'NAV04', 'NAV05',
  'AD01',
  'VOO DE INCENTIVO', 'VOO INCENTIVO', 'VOO EMPRESA',
])

const MISSOES_AVALIACAO = new Set([
  'CHEQUE ANAC', 'CHEQUE ANAC - PC', 'AVALIAÇÃO FINAL', 'AVAL. FINAL',
  'CHEQUE FINAL', 'IFR FINAL', 'FAP', 'CHEQUE', 'AVALIAÇÃO',
])

const VALID_ST = new Set(['CONFIRMADO', 'PENDENTE', 'AGUARDANDO CONFIRMAÇÃO', 'REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE'])
const SKIP_VALIDATION_ST = new Set(['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE'])
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
  isAuthenticated: sessionStorage.getItem(SESSION_KEY) === '1',
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
  editorTitle: '✈ CCO · Editor de Escala',
  shuffleLog: '',
  calendarYear: new Date().getFullYear(),
  calendarMonthIdx: new Date().getMonth(),
  calData: {},
  SCH: [],
  INITIAL: [],
  INST: {},
  highlighted: new Set(),
  scoreOk: 0,
  scoreErr: 0,
  scoreSjk: '',
  scoreCpq: '',
})

function login() {
  if (state.loginUser.trim() === USER_EMAIL && state.loginPass === USER_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1')
    state.isAuthenticated = true
    state.loginError = false
    return true
  }
  state.loginError = true
  return false
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY)
  state.isAuthenticated = false
  // Reset other relevant state if needed
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
  }
  const iAluno = findCol(header, COLS.aluno)
  const iStatus = findCol(header, COLS.status)
  const iInva = findCol(header, COLS.inva)
  const iBarra = findCol(header, COLS.barra)
  const iData = findCol(header, COLS.data)
  const iMissao = findCol(header, COLS.missao)
  const iHorario = findCol(header, COLS.horario)

  const gAluno = iAluno >= 0 ? (r) => String(r[iAluno] || '').trim() : (r) => String(r[0] || '').trim()
  const gStatus = iStatus >= 0 ? (r) => String(r[iStatus] || '').trim().toUpperCase() : (r) => String(r[1] || '').trim().toUpperCase()
  const gInva = iInva >= 0 ? (r) => String(r[iInva] || '').trim() : (r) => String(r[2] || '').trim()
  const gBarra = iBarra >= 0 ? (r) => String(r[iBarra] || '').trim() : (r) => String(r[3] || '').trim()
  const gData = iData >= 0 ? (r) => String(r[iData] || '').trim() : (r) => String(r[5] || '').trim()
  const gMissao = iMissao >= 0 ? (r) => String(r[iMissao] || '').trim() : (r) => String(r[6] || '').trim()
  const gHorario = iHorario >= 0 ? (r) => String(r[iHorario] || '').trim() : (r) => String(r[7] || '').trim()

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

    if (!VALID_ST.has(status) || !barra || !horario) continue
    const hm = horario.match(/^(\d{2}:\d{2})/)
    if (!hm) continue
    const hora = hm[1]
    const base = getBase(barra)
    let missaoShort = missao
    if (missao.includes(' > ')) missaoShort = missao.split(' > ').pop().trim()
    const isAnac = inva.toUpperCase().includes('ANDRE OLIVEIRA') || inva.toUpperCase().includes('PISANI')
    const isNavsolo = missaoShort.toUpperCase().includes('NAV SOLO') || missaoShort.toUpperCase().includes('NAV MENTOR')

    if (!state.parsedDate && data) {
      state.parsedDate = normalizeDate(data)
    }
    state.parsedSlots.push({ barra, base, hora, aluno, inva, ae: '', missao: missaoShort, st: status, anac: isAnac, navsolo: isNavsolo, data })
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

function isInc(aluno) {
  return aluno && aluno.toUpperCase().includes('INCENTIVO')
}

function isMissaoPermitidaEventual(missao) {
  if (!missao) return true
  const m = missao.toUpperCase().trim()
  for (const p of MISSOES_EVENTUAL_PERMITIDAS) {
    if (m === p || m.startsWith(`${p} `) || m.endsWith(` ${p}`) || m.includes(p)) return true
  }
  if (/^NAV\s*\d/.test(m) || m.startsWith('NAV ')) {
    if (m.includes('NAV X1') || m.includes('NAV X2')) return false
    return true
  }
  const ehAval = Array.from(MISSOES_AVALIACAO).some((a) => m.includes(a))
  const ehSim = m.startsWith('SIM ') || m.startsWith('LAB ')
  const ehIfr = m.startsWith('IFR ')
  const ehInva = m === 'INVA' || m.startsWith('INVA ')
  if (!ehAval && !ehSim && !ehIfr && !ehInva) return true
  return false
}

function normalizeInstructorName(nomeXls, inst) {
  if (!nomeXls) return ''
  const upper = nomeXls.trim().toUpperCase()
  if (inst[upper]) return upper
  for (const nome of Object.keys(inst)) {
    if (upper.startsWith(`${nome} `) || upper === nome) return nome
  }
  const xlsWords = upper.split(' ').filter(Boolean)
  for (const nome of Object.keys(inst)) {
    const nomWords = nome.split(' ').filter(Boolean)
    if (xlsWords[0] === nomWords[0] && xlsWords[xlsWords.length - 1] === nomWords[nomWords.length - 1]) return nome
  }
  for (const nome of Object.keys(inst)) {
    const nomWords = nome.split(' ').filter(Boolean)
    if (xlsWords[0] === nomWords[0] && nomWords.slice(1).some((w) => xlsWords.includes(w))) return nome
  }
  return upper
}

function buildInst() {
  const inst = {}
  for (const base of ['SJK', 'CPQ']) {
    for (const q of QUADRO[base]) {
      const av = state.availability[q.nome] || 'avail'
      inst[q.nome] = { base, tipo: q.tipo, auth: q.auth, folga: av === 'folga', cond: av === 'cond' }
    }
  }
  return inst
}

function fillSolosDoCalendario(dateString) {
  if (!dateString) return
  const parts = dateString.split('/')
  if (parts.length < 3) return
  const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  const ano = parseInt(parts[2], 10)
  const mesIdx = parseInt(parts[1], 10) - 1
  let data = {}
  try {
    const raw = localStorage.getItem(`cco_solo_cal_${ano}_${mesIdx + 1}`)
    data = raw ? JSON.parse(raw) : {}
  } catch (e) {
    data = {}
  }
  SOLO_INSTRUTORES.forEach((instr) => {
    const key = `${instr.nome}|${iso}`
    const estado = data[key] || 'avail'
    state.availability[instr.nome] = estado === 'weekend' ? 'avail' : estado
  })
}

function buildAvailForm() {
  fillSolosDoCalendario(state.parsedDate)
  ;[...QUADRO.SJK, ...QUADRO.CPQ].forEach((q) => {
    if (q.tipo.includes('solo')) return
    if (!(q.nome in state.availability)) state.availability[q.nome] = 'avail'
  })
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
  state.parsedSlots.forEach((s) => {
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
    let ae = ''
    const bu = barraId.toUpperCase()
    if (bu.includes('SIRA')) ae = 'SIRA'
    else if (bu.includes('SM AATD') || bu.includes('SIM AATD')) ae = 'SM AATD'
    else if (bu.includes('PCATD') || bu.includes('SM PCATD') || bu.includes('SIM PCATD')) ae = 'SM PCATD'
    else if (bu.includes('COLT')) ae = 'COLT'
    else ae = 'MC01'

    horasFinais.forEach((hora) => {
      const existing = byHora[hora]
      const invaRaw = existing ? normalizeInstructorName(existing.inva, state.INST) : ''
      const d = state.INST[invaRaw]
      const invaClean = d && d.folga ? '' : invaRaw
      sid += 1
      schSlots.push({
        id: `s${sid}`,
        barra: barraId,
        base,
        hora,
        aluno: existing ? existing.aluno : '',
        inva: invaClean,
        ae,
        missao: existing ? existing.missao : '',
        st: existing ? existing.st : '',
        anac: existing ? existing.anac : false,
        navsolo: existing ? existing.navsolo : false,
        incentOk: false,
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

function getErrs(slot) {
  const errs = []
  if (slot.anac || !slot.aluno) return errs
  if (SKIP_VALIDATION_ST.has(slot.st)) return errs
  if (slot.navsolo) {
    if (!slot.inva) errs.push({ code: 'NO_INSTR', msg: `Sem instrutor de solo: ${slot.barra} ${slot.hora} (${slot.aluno})` })
    return errs
  }
  if (isInc(slot.aluno) && slot.incentOk) return errs
  if (!slot.inva) {
    errs.push({ code: 'NO_INSTR', msg: `Sem instrutor: ${slot.barra} ${slot.hora} (${slot.aluno})` })
    return errs
  }
  const d = state.INST[slot.inva]
  if (!d) return errs
  if (d.folga) errs.push({ code: 'FOLGA', msg: `${slot.inva} em folga → ${slot.hora} ${slot.barra}` })
  if (!isAuth(slot.inva, slot.barra)) errs.push({ code: 'BARRA', msg: `${slot.inva} não autorizado para ${slot.barra}` })
  if (slot.missao && slot.missao.toUpperCase().includes('LAB') && !LAB_AUTH.has(slot.inva)) errs.push({ code: 'LAB', msg: `${slot.inva} não autorizado LAB → ${slot.hora} ${slot.barra}` })
  if (d.tipo === 'eventual_rest' && slot.missao && !isMissaoPermitidaEventual(slot.missao)) errs.push({ code: 'MISSAO_REST', msg: `⛔ Missão não autorizada para eventual: ${slot.inva} → ${slot.missao} (${slot.hora})` })
  return errs
}

function getCross(sch = state.SCH) {
  const ce = {}
  const byI = {}
  sch.forEach((s) => {
    if (!s.inva || s.inva.trim() === '' || s.inva === '--' || s.anac || !s.aluno || SKIP_VALIDATION_ST.has(s.st)) return
    if (!byI[s.inva]) byI[s.inva] = []
    byI[s.inva].push(s)
  })
  Object.entries(byI).forEach(([instr, slots]) => {
    const sr = slots.slice().sort((a, b) => hv(a.hora) - hv(b.hora))
    for (let i = 0; i < sr.length; i += 1) {
      for (let j = i + 1; j < sr.length; j += 1) {
        if (sr[i].hora === sr[j].hora && sr[i].barra !== sr[j].barra) {
          const msg = `🚫 Simultâneo: ${instr} às ${sr[i].hora} em ${sr[i].barra} + ${sr[j].barra}`
          ;[sr[i].id, sr[j].id].forEach((id) => {
            if (!ce[id]) ce[id] = []
            ce[id].push({ code: 'SIMULT', msg })
          })
        }
      }
    }
    for (let i = 0; i < sr.length - 1; i += 1) {
      if (Math.abs(hv(sr[i + 1].hora) - hv(sr[i].hora) - 2) < 0.01 && sr[i].aluno !== sr[i + 1].aluno) {
        const s1inc = isInc(sr[i].aluno)
        const s2inc = isInc(sr[i + 1].aluno)
        if ((s1inc && sr[i].incentOk) || (s2inc && sr[i + 1].incentOk)) continue
        const code = s1inc || s2inc ? 'CONSEC_INC' : 'CONSEC'
        const msg = s1inc || s2inc
          ? `⚠ Incentivo: ${instr} → ${sr[i].hora} + ${sr[i + 1].hora} (verificar duração)`
          : `⚠ Consecutividade: ${instr} → ${sr[i].hora} (${sr[i].aluno.split(' ')[0]}) + ${sr[i + 1].hora} (${sr[i + 1].aluno.split(' ')[0]})`
        ;[sr[i].id, sr[i + 1].id].forEach((id) => {
          if (!ce[id]) ce[id] = []
          ce[id].push({ code, msg })
        })
      }
    }
    const hs = sr.map((s) => hv(s.hora)).filter((h) => h > 0)
    if (hs.length) {
      const j = Math.max(...hs) + 2 - (Math.min(...hs) - 1)
      if (j > 11) {
        const msg = `⛔ Jornada: ${instr} → ${j.toFixed(0)}h (máx 11h)`
        sr.forEach((s) => {
          if (!ce[s.id]) ce[s.id] = []
          ce[s.id].push({ code: 'JORNADA', msg })
        })
      }
    }
  })
  return ce
}

function score(sch = state.SCH) {
  const ce = getCross(sch)
  let errs = 0
  let ok = 0
  sch.forEach((s) => {
    if (!s.aluno || s.anac) return
    if (SKIP_VALIDATION_ST.has(s.st)) return
    if (s.navsolo) {
      if (s.inva) ok += 1
      else errs += 1
      return
    }
    if (isInc(s.aluno) && s.incentOk) {
      ok += 1
      return
    }
    const all = [...getErrs(s), ...(ce[s.id] || [])]
    if (all.some((e) => ERR_CODES.has(e.code))) errs += 1
    else if (s.inva) ok += 1
    else errs += 1
  })
  return { errs, ok }
}

function canAssign(name, slot, sch = state.SCH) {
  const d = state.INST[name]
  if (!d || d.folga || d.tipo === 'anac') return false
  if (slot.navsolo) {
    return d.tipo === 'solo_cpq' || d.tipo === 'solo_sjk'
  }
  if (!isAuth(name, slot.barra)) return false
  if (slot.missao && slot.missao.toUpperCase().includes('LAB') && !LAB_AUTH.has(name)) return false
  const hora = hv(slot.hora)
  const my = sch.filter((s) => s.inva === name && s.aluno && s.id !== slot.id && !s.anac)
  if (my.some((s) => hv(s.hora) === hora)) return false
  const all = [...my, { ...slot, inva: name }].sort((a, b) => hv(a.hora) - hv(b.hora))
  for (let i = 0; i < all.length - 1; i += 1) {
    if (Math.abs(hv(all[i + 1].hora) - hv(all[i].hora) - 2) < 0.01 && all[i].aluno !== all[i + 1].aluno) {
      if (!isInc(all[i].aluno) && !isInc(all[i + 1].aluno)) return false
    }
  }
  const hs = my.map((s) => hv(s.hora)).concat([hora]).filter((h) => h > 0)
  if (hs.length && Math.max(...hs) + 2 - (Math.min(...hs) - 1) > 11) return false
  return true
}

function candidates(slot) {
  return Object.keys(state.INST)
    .filter((n) => state.INST[n].tipo !== 'anac' && !state.INST[n].cond && canAssign(n, slot))
    .sort((a, b) => state.SCH.filter((s) => s.inva === a && s.aluno).length - state.SCH.filter((s) => s.inva === b && s.aluno).length)
}

function smartShuffle() {
  const before = score(state.SCH).errs
  let best = state.SCH.map((s) => ({ ...s }))
  let bestScore = score(best).errs
  const changes = []
  for (let pass = 0; pass < 12; pass += 1) {
    const ce = getCross(best)
    const prob = best
      .filter((s) => s.aluno && !s.anac)
      .map((s) => ({
        slot: s,
        n: [...getErrs(s), ...(ce[s.id] || [])].filter((e) => ERR_CODES.has(e.code)).length + (s.navsolo && !s.inva ? 1 : 0),
      }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (!prob.length) break
    let improved = false
    for (const { slot } of prob) {
      const cands = candidates(slot)
      if (!cands.length) continue
      let bestC = null
      let bestGain = -Infinity
      for (const c of cands) {
        if (c === slot.inva) continue
        const trial = best.map((s) => (s.id === slot.id ? { ...s, inva: c } : s))
        const gain = bestScore - score(trial).errs
        if (gain > bestGain) {
          bestGain = gain
          bestC = c
        }
      }
      if (bestC && bestGain >= 0) {
        const old = slot.inva
        best = best.map((s) => (s.id === slot.id ? { ...s, inva: bestC } : s))
        const ns = score(best).errs
        if (ns <= bestScore) {
          if (old !== bestC) {
            changes.push({ id: slot.id, from: old, to: bestC, hora: slot.hora, b: slot.barra.split(' ')[0] })
          }
          bestScore = ns
          improved = true
        } else {
          best = best.map((s) => (s.id === slot.id ? { ...s, inva: old } : s))
        }
      }
    }
    if (!improved) break
  }
  const after = score(best).errs
  state.SCH = best
  state.highlighted = new Set(changes.map((c) => c.id))
  if (after < before) {
    state.shuffleLog = `⚡ ${changes.length} mudança(s) — ${before - after} erro(s) eliminado(s).`
    setTimeout(() => {
      state.highlighted = new Set()
    }, 3000)
  } else if (after === 0) {
    state.shuffleLog = '✅ Escala 100% verde!'
  } else {
    state.shuffleLog = `⚡ Melhor possível: ${after} problema(s) restante(s).`
  }
  updateScore()
}

function resetSchedule() {
  state.SCH = state.INITIAL.map((s) => ({ ...s }))
  state.highlighted = new Set()
  state.shuffleLog = '↺ Escala restaurada ao estado original.'
  updateScore()
}

function hv(hora) {
  const m = hora && hora.match(/^(\d+):(\d+)/)
  return m ? +m[1] + +m[2] / 60 : 0
}

function isAuth(name, bid) {
  const d = state.INST[name]
  if (!d) return false
  const b = bid.toUpperCase()
  if (b.includes('SIRA')) return d.auth.includes('SIRA')
  if (b.includes('SM AATD SJK')) return d.auth.includes('SM_AATD_SJK')
  if (b.includes('SIM AATD CPQ')) return d.auth.includes('SM_AATD_CPQ')
  if (b.includes('SBSJ') || b.includes('SM PCATD SJK') || b.includes('SIM PCATD SJK')) return d.auth.includes('PCATD_SJK')
  if (b.includes('PCATD') || b.includes('SM PCATD') || b.includes('SIM PCATD')) return d.auth.includes('PCATD_SJK') || d.auth.includes('PCATD_CPQ')
  if (b.includes('COLT')) return d.auth.includes('COLT')
  if (b.includes('MC')) return d.auth.includes('MC01')
  return false
}

function getSlotClass(slot) {
  if (slot.anac) return 'sc sc-anac'
  if (!slot.aluno) return SKIP_VALIDATION_ST.has(slot.st) ? 'sc sc-st-other' : 'sc sc-empty'
  if (SKIP_VALIDATION_ST.has(slot.st)) return 'sc sc-st-other'
  if (isInc(slot.aluno) && slot.incentOk) return 'sc sc-ok-manual'
  if (slot.navsolo && !slot.inva) return 'sc sc-err'
  if (!slot.inva) return 'sc sc-err'
  const all = [...getErrs(slot), ...(getCross()[slot.id] || [])]
  if (all.some((e) => ERR_CODES.has(e.code))) return 'sc sc-err'
  if (all.some((e) => e.code === 'CONSEC_INC')) return 'sc sc-incent'
  if (all.some((e) => e.code === 'CONSEC')) return 'sc sc-warn'
  return stCls(slot.st)
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
  if (SOLO_INSTRUTORES.some((instr) => instr.nome === nome) && state.parsedDate) {
    const parts = state.parsedDate.split('/')
    if (parts.length >= 3) {
      const ano = parseInt(parts[2], 10)
      const mes = parseInt(parts[1], 10)
      const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      const key = `${nome}|${iso}`
      const storKey = `cco_solo_cal_${ano}_${mes}`
      let data = {}
      try {
        const r = localStorage.getItem(storKey)
        data = r ? JSON.parse(r) : {}
      } catch (e) {
        data = {}
      }
      data[key] = state.availability[nome]
      try {
        localStorage.setItem(storKey, JSON.stringify(data))
      } catch (e) {
        console.error(e)
      }
    }
  }
  state.INST = buildInst()
}

function updateScore() {
  const total = score(state.SCH)
  state.scoreOk = total.ok
  state.scoreErr = total.errs
  const sjk = score(state.SCH.filter((s) => s.base === 'SJK'))
  const cpq = score(state.SCH.filter((s) => s.base === 'CPQ'))
  state.scoreSjk = sjk.errs > 0 ? `⛔ ${sjk.errs}` : '✅ OK'
  state.scoreCpq = cpq.errs > 0 ? `⛔ ${cpq.errs}` : '✅ OK'
}

function approveIncentivo(slotId) {
  const slot = state.SCH.find((s) => s.id === slotId)
  if (slot && isInc(slot.aluno)) {
    slot.incentOk = true
    updateScore()
  }
}

function updateSlotInstructor(id, value) {
  const slot = state.SCH.find((s) => s.id === id)
  if (slot) {
    slot.inva = value
    updateScore()
  }
}

function updateSlotStatus(id, value) {
  const slot = state.SCH.find((s) => s.id === id)
  if (slot) {
    slot.st = value
    updateScore()
  }
}

function swapSlots(idA, idB) {
  const a = state.SCH.find((s) => s.id === idA)
  const b = state.SCH.find((s) => s.id === idB)
  if (!a || !b) return
  const fields = ['aluno', 'inva', 'missao', 'st', 'anac', 'navsolo', 'incentOk']
  const temp = {}
  fields.forEach((key) => { temp[key] = a[key] })
  fields.forEach((key) => { a[key] = b[key] })
  fields.forEach((key) => { b[key] = temp[key] })
  updateScore()
}

function getTabBlocks(base) {
  const barras = [...new Set(state.SCH.map((slot) => slot.barra))]
    .map((barraId) => {
      const slots = state.SCH.filter((s) => s.barra === barraId).sort((a, b) => hv(a.hora) - hv(b.hora))
      return { id: barraId, base: slots[0]?.base || 'SJK', ae: slots[0]?.ae || '—', slots }
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

const calendarRows = computed(() => SOLO_INSTRUTORES.map((instr) => ({
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

function toggleCalendarInstr(instrName) {
  const current = state.availability[instrName] || 'avail'
  const next = ['avail', 'folga', 'cond'][(['avail', 'folga', 'cond'].indexOf(current) + 1) % 3]
  state.availability[instrName] = next
  state.INST = buildInst()
}

const availabilityGroups = computed(() => ({
  SJK: {
    voo: QUADRO.SJK.filter((q) => !q.tipo.includes('solo')),
    solo: SOLO_INSTRUTORES.filter((instr) => instr.base === 'SJK'),
  },
  CPQ: {
    voo: QUADRO.CPQ.filter((q) => !q.tipo.includes('solo')),
    solo: SOLO_INSTRUTORES.filter((instr) => instr.base === 'CPQ'),
  },
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

export function useCcoStore() {
  return {
    state,
    login,
    logout,
    checkLogin,
    onFile,
    generateEditor: gerarEditor,
    voltarUpload,
    smartShuffle,
    resetSchedule,
    approveIncentivo,
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
    scoreOk: computed(() => state.scoreOk),
    scoreErr: computed(() => state.scoreErr),
    isAuth,
    getCross,
    getErrs,
    getSlotClass,
    hv,
    swapSlots,
    SKIP_VALIDATION_ST,
    scoreSjk: computed(() => state.scoreSjk),
    scoreCpq: computed(() => state.scoreCpq),
    activeTab: computed({ get: () => state.activeTab, set: (value) => { state.activeTab = value } }),
    editorTitle: computed(() => state.editorTitle),
    shuffleLog: computed(() => state.shuffleLog),
    fileName: computed(() => state.fileName),
    fileOk: computed(() => state.fileOk),
    availSectionVisible: computed(() => state.availSectionVisible),
    btnGerarDisabled: computed(() => state.btnGerarDisabled),
    parsedDate: computed(() => state.parsedDate),
    parsedDayName: computed(() => state.parsedDayName),
  }
}
