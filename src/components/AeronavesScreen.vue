<template>
  <div class="screen-layout">
    <div id="ae-screen" class="aeronaves-screen">
      <div class="ae-header">
        <div class="ae-title-area">
          <h1>✈️ Gestão de Aeronaves</h1>
          <p>Visualize e gerencie a frota da Safe TI</p>
        </div>
        <div class="header-actions">
          <button class="btn-ae-back" @click="handleBackToEditor">← Voltar ao Editor</button>
          <button class="btn-logout-ae" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="ae-body">
        <div class="empty-state">
          <div class="empty-icon">🛠️</div>
          <h2>Módulo em Desenvolvimento</h2>
          <p>Esta área será utilizada para gerenciar as aeronaves, status de manutenção e modelos da frota.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

function handleBackToEditor() {
  router.push('/editor')
}

function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  padding: 24px;
  background: #f0f4f8;
}
.aeronaves-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.ae-header {
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
.ae-title-area h1 { font-size: 20px; font-weight: 800; margin: 0; }
.ae-title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }

.header-actions { display: flex; gap: 12px; }
.btn-ae-back, .btn-logout-ae {
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
.btn-ae-back:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.btn-logout-ae { background: #c0392b; border: none; }
.btn-logout-ae:hover { background: #a93226; transform: translateY(-1px); }

.ae-body {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 80px 20px;
  text-align: center;
  border: 1px solid #dae2ec;
}
.empty-state {
  max-width: 500px;
  margin: 0 auto;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}
.empty-state h2 {
  font-size: 22px;
  color: #1d2951;
  margin-bottom: 12px;
}
.empty-state p {
  color: #64748b;
  line-height: 1.6;
}
</style>
