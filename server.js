// ══════════════════════════════════════════════════════
// CCO v10 — Servidor Express
// Centro de Controle de Operações · SAFE Aviation School
// ══════════════════════════════════════════════════════
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Servir arquivos estáticos da pasta public ────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── Health check ─────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    status:    'CCO v10 online',
    timestamp: new Date().toISOString(),
    version:   '10.0.0'
  });
});

// ── Fallback → index.html (SPA) ──────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Iniciar servidor ─────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✈  CCO Editor de Escala v10');
  console.log('  ─────────────────────────────────────');
  console.log(`  🟢 Servidor rodando em http://localhost:${PORT}`);
  console.log('  📂 Abra o navegador no endereço acima');
  console.log('');
});
