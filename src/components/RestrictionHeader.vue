<template>
  <div class="rest-header">
    <div class="rest-title-area">
      <h1>🛠️ Gestão de Restrições Operacionais</h1>
      <p>Configure alertas e impedimentos cruzados para a escala</p>
    </div>
    <div class="header-actions">
      <button class="btn-rest-back" @click="$emit('back')">← Voltar ao Editor</button>
      <button class="btn-logout-rest" @click="$emit('logout')">Sair</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['back', 'logout'])
</script>

<style scoped>
.rest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  background: #1d2951;
  color: #fff;
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.rest-title-area h1 { font-size: 20px; font-weight: 800; margin: 0; }
.rest-title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }

.header-actions { display: flex; gap: 12px; }
.btn-rest-back, .btn-logout-rest {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-rest-back:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.btn-logout-rest { background: #c0392b; border: none; }
.btn-logout-rest:hover { background: #a93226; transform: translateY(-1px); }
</style>
