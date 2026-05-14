/**
 * Utility for parsing Excel rows into domain-specific objects.
 * Separated from the store to improve modularity and testability.
 */

const DIAS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const AVAIL_TYPES_MAP = {
  'disponivel': 1, 'disponível': 1,
  'folga regular': 2, 'folga social': 3,
  'sobreaviso': 4, 'treinamento': 5,
  'férias': 6, 'ferias': 6,
  'banco de horas': 7, 'operações': 8,
  'trabalho externo': 9, 'dispensa médica': 10,
  'não especificado': 11
}

export function normalizeDate(value) {
  if (!value) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const parts = value.substring(0, 10).replace(/-/g, '/').split('/')
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return value
}

export function getBase(barraId) {
  const b = String(barraId || '').toUpperCase()
  if (b.includes('CPQ') || b.includes('COLT') || b.includes('SDAM') || b.includes('SIM AATD CPQ')) return 'CPQ'
  if (b.includes('SJK') || b.includes('SIRA') || b.includes('SM AATD SJK') || b.includes('SBSJ')) return 'SJK'
  if (b.includes('BACKUP')) return 'SJK'
  return 'SJK'
}

export function parseSlotsFromRows(rows) {
  if (!rows || !rows.length) return { slots: [], parsedDate: '', parsedDayName: '' }
  
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

  let parsedDate = ''
  let parsedDayName = ''
  const slots = []

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    const barra = gBarra(row)
    const horario = gHorario(row)
    if (!barra || !horario) continue

    const hm = horario.match(/^(\d{2}:\d{2})/)
    if (!hm) continue
    const hora = hm[1]
    const base = getBase(barra)
    const missao = gMissao(row)
    let missaoShort = missao
    if (missao.includes(' > ')) missaoShort = missao.split(' > ').pop().trim()

    const data = gData(row)
    if (!parsedDate && data) {
      parsedDate = normalizeDate(data)
    }

    slots.push({
      barra, base, hora,
      aluno: gAluno(row),
      inva: gInva(row),
      ae: gAe(row),
      missao: missaoShort,
      st: gStatus(row),
      data,
      obs: gObs(row)
    })
  }

  if (parsedDate) {
    const parts = parsedDate.split('/')
    if (parts.length >= 3) {
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
      parsedDayName = DIAS_PT[d.getDay()] || ''
    }
  }

  return { slots, parsedDate, parsedDayName }
}

export function parseWorkSchedulesFromRows(rows, invasCatalog) {
  if (!rows || !rows.length) return []
  
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
  const schedules = []

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
    const inva = invasCatalog.find(inv => {
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
      schedules.push({
        data: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
        periodo: pCode,
        tipoDisponibilidadeId: tId,
        invaId: inva.id,
        motivo: String(row[iMot] || '').trim()
      })
    }
  }
  return schedules
}
