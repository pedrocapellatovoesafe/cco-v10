// src/parser.js
const XLSX = require('xlsx');

/**
 * Parseia o arquivo XLS exportado do Cavok
 * Colunas esperadas (em ordem):
 * aluno | status | inva | barra | aeronave | data | missao | horario | obs | tipo_voo
 */
function parseXLS(filePath) {
  const workbook  = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];
  const rows      = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const slots = [];
  const STATUS_VALIDOS = ['CONFIRMADO', 'PENDENTE', 'AGUARDANDO CONFIRMAÇÃO'];
  const STATUS_IGNORADOS = ['OPERAÇÕES', 'MANUTENÇÃO', 'REVISÃO',
                            'INDISPONIBILIDADE', 'METEOROLOGIA', 'REVISAO'];

  // Pula a linha de cabeçalho (índice 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c === '')) continue;

    const [aluno, status, inva, barra, aeronave,
           data, missao, horario, obs, tipo_voo] = row.map(c =>
      String(c || '').trim().toUpperCase()
    );

    const statusNorm = status.toUpperCase();

    // Ignora status fora do escopo
    if (STATUS_IGNORADOS.some(s => statusNorm.includes(s))) continue;
    if (!STATUS_VALIDOS.some(s => statusNorm.includes(s))) continue;

    // Parse de horário: "08:00 - 10:00"
    let horaInicio = null, horaFim = null;
    if (horario.includes(' - ') || horario.includes('-')) {
      const sep    = horario.includes(' - ') ? ' - ' : '-';
      const partes = horario.split(sep);
      horaInicio   = partes[0]?.trim();
      horaFim      = partes[1]?.trim();
    }

    // Identifica a base pelo campo barra/aeronave
    let base = 'SJK';
    const barraNorm = barra.toUpperCase();
    if (
      barraNorm.includes('CPQ') ||
      barraNorm.includes('SM AATD CPQ') ||
      ['PS-SFE', 'PS-SFI', 'PS-SFH', 'PS-LOM'].some(r =>
        aeronave.includes(r) && barraNorm.includes('CPQ'))
    ) {
      base = 'CPQ';
    }

    slots.push({
      linha: i + 1,
      aluno:      row[0] ? String(row[0]).trim() : '',
      status:     String(row[1] || '').trim(),
      inva:       String(row[2] || '').trim(),
      barra:      String(row[3] || '').trim(),
      aeronave:   String(row[4] || '').trim(),
      data:       String(row[5] || '').trim(),
      missao:     String(row[6] || '').trim(),
      horario:    String(row[7] || '').trim(),
      obs:        String(row[8] || '').trim(),
      tipo_voo:   String(row[9] || '').trim(),
      horaInicio,
      horaFim,
      base
    });
  }

  return {
    total: slots.length,
    basesSJK: slots.filter(s => s.base === 'SJK').length,
    basesCPQ: slots.filter(s => s.base === 'CPQ').length,
    slots
  };
}

module.exports = { parseXLS };