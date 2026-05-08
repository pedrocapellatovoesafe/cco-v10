<template>
  <div class="screen-layout">
    <div id="upload-screen" class="upload-screen">
      <div class="up-header">
        <div class="up-header-title">
          <img :src="iconUrl" alt="SAFE" style="width:36px;height:36px;border-radius:50%;opacity:.9;" />
          <div>
            <h1>✈ CCO Editor de Escala v10</h1>
            <p>Carregue o export do Cavok e informe a disponibilidade do dia</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-calendar" @click="handleOpenCalendar">📅 Calendário de Solo</button>
          <button class="btn-logout" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="up-body">
        <div
          class="drop-zone"
          :class="{ 'drag-over': dragging }"
          @click.prevent="triggerFileInput"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <input type="file" ref="fileInput" accept=".xls,.xlsx" @change="onFileInput" />
          <div class="drop-icon">📂</div>
          <h3>Clique ou arraste o arquivo XLS do Cavok</h3>
          <p>Formatos aceitos: .xls e .xlsx</p>
          <button class="btn-upload" @click.stop.prevent="triggerFileInput">Selecionar arquivo</button>
        </div>

        <div class="file-ok" v-if="store.state.fileOk">✅ <span>{{ store.state.fileName }}</span> carregado com sucesso!</div>

        <div class="avail-section" v-if="store.state.availSectionVisible">
          <h3>Disponibilidade do dia</h3>
          <p class="avail-help">
            Clique em cada instrutor para alternar: Verde = disponível · Vermelho = folga · Amarelo = condicional (CCO confirma)
          </p>
          <div class="avail-legend">
            <span class="leg"><span class="leg-dot ld-avail"></span> Disponível</span>
            <span class="leg"><span class="leg-dot ld-folga"></span> Folga</span>
            <span class="leg"><span class="leg-dot ld-cond"></span> Condicional</span>
          </div>

          <div class="avail-base" v-for="base in ['SJK', 'CPQ']" :key="base">
            <h4>✈ {{ base === 'SJK' ? 'SJK — São José dos Campos' : 'CPQ — Campinas' }}</h4>
            <div class="avail-subtitle">INSTRUTORES DE VOO</div>
            <div class="instr-grid">
              <span
                v-for="instr in store.availabilityGroups.value[base].voo"
                :key="instr.nome"
                class="instr-toggle"
                :class="store.availabilityState(instr.nome)"
                @click="store.toggleDisp(instr.nome)"
                :title="instr.nome"
              >
                {{ instr.nome.split(' ')[0] }}
              </span>
            </div>
          </div>

          <p class="avail-notice">✓ Disponibilidade dos instrutores de solo carregada automaticamente do Calendário.</p>
          
          <div v-if="store.state.uploadError" class="upload-error">
            ❌ {{ store.state.uploadError }}
          </div>

          <button 
            class="btn-gerar" 
            :disabled="store.state.btnGerarDisabled || store.state.isUploading" 
            @click="handleGenerateEditor"
          >
            <span v-if="store.state.isUploading">⏳ Enviando para o servidor...</span>
            <span v-else>⚡ Gerar Editor de Escala</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import iconUrl from '../icons/icon-192.png'
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'

const store = inject('store')
const router = useRouter()
const dragging = ref(false)
const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileInput(event) {
  const file = event.target.files?.[0]
  if (file) store.onFile(file)
}

function onDrop(event) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) store.onFile(file)
}

function handleLogout() {
  store.logout()
  router.push('/login')
}

function handleOpenCalendar() {
  router.push('/calendar')
}

async function handleGenerateEditor() {
  const result = await store.importScale()
  if (result.success) {
    router.push('/editor')
  }
}
</script>

<style scoped>
/* ... rest of styles ... */
.upload-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #721c24;
  margin-top: 16px;
  margin-bottom: 8px;
}
/* ... existing styles ... */
.screen-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.upload-screen {
  max-width: 900px;
  width: 100%;
}
.up-header {
  background: #1d2951;
  color: #fff;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.up-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.up-header img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  opacity: 0.9;
}
.up-header h1 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}
.up-header p {
  margin: 6px 0 0;
  font-size: 12px;
  opacity: 0.8;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.btn-calendar, .btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 5px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}
.btn-calendar:hover, .btn-logout:hover {
  background: rgba(255, 255, 255, 0.28);
}
.btn-logout {
  background: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.4);
}
.btn-logout:hover {
  background: rgba(231, 76, 60, 0.3);
}
.up-body {
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}
.drop-zone {
  border: 2px dashed #5baee2;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 20px;
  position: relative;
}
.drop-zone.drag-over,
.drop-zone:hover {
  background: #eaf2f8;
}
.drop-zone input {
  display: none;
}
.drop-icon {
  font-size: 40px;
  margin-bottom: 10px;
}
.drop-zone h3 {
  font-size: 15px;
  color: #1d2951;
  font-weight: bold;
  margin-bottom: 6px;
}
.drop-zone p {
  font-size: 12px;
  color: #888;
}
.btn-upload {
  background: #1d2951;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 24px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
.btn-upload:hover {
  background: #162040;
}
.file-ok {
  background: #d4edda;
  border: 1px solid #b8dac8;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #155724;
  margin-bottom: 16px;
}
.avail-section {
  margin-top: 8px;
}
.avail-section h3 {
  font-size: 15px;
  margin-bottom: 10px;
}
.avail-help {
  font-size: 11px;
  color: #888;
  margin-bottom: 12px;
}
.avail-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 11px;
  flex-wrap: wrap;
}
.leg {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
.leg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ld-avail { background: #27ae60; }
.ld-folga { background: #c0392b; }
.ld-cond { background: #f39c12; }
.avail-base {
  margin-bottom: 16px;
}
.avail-base h4 {
  font-size: 13px;
  font-weight: bold;
  color: #1d2951;
  margin-bottom: 8px;
}
.avail-subtitle {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
  font-weight: bold;
}
.instr-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.instr-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  user-select: none;
  transition: all 0.15s;
}
.instr-toggle:hover {
  border-color: #1d2951;
}
.instr-toggle.avail { background: #d4edda; border-color: #b8dac8; color: #155724; }
.instr-toggle.folga { background: #fdecea; border-color: #f5b8b5; color: #7b1a19; text-decoration: line-through; }
.instr-toggle.cond { background: #fef9e7; border-color: #f0d080; color: #856404; }
.avail-notice {
  font-size: 11px;
  color: #27ae60;
  margin-top: 4px;
}
.btn-gerar {
  width: 100%;
  background: #5baee2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;
}
.btn-gerar:hover:not(:disabled) {
  background: #4a9fd0;
}
.btn-gerar:disabled {
  background: #999;
  cursor: default;
}
</style>
