<template>
  <div class="screen-layout">
    <div id="upload-screen" class="upload-screen">
      <div class="up-header">
        <div class="up-header-title">
          <img :src="iconUrl" alt="SAFE" style="width:36px;height:36px;border-radius:50%;opacity:.9;" />
          <div>
            <h1>✈ CCO Editor de Escala v10</h1>
            <p>Portal de Importação de Dados</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-calendar" @click="handleOpenCalendar">📅 Calendário de Instrutores</button>
          <button class="btn-calendar" @click="handleBackToEditor">Voltar ao Editor</button>
        </div>
      </div>

      <div class="up-body">
        <div class="upload-grid">
          <!-- Form 1: Escala de Voos (Cavok) -->
          <div class="upload-card">
            <div class="card-header">
              <span class="card-icon">✈</span>
              <h2>Escala de Voos</h2>
              <p>Importar exportação XLS do Cavok</p>
            </div>
            
            <div
              class="drop-zone"
              :class="{ 'drag-over': draggingScale }"
              @click.prevent="triggerScaleInput"
              @dragover.prevent="draggingScale = true"
              @dragleave.prevent="draggingScale = false"
              @drop.prevent="onDropScale"
            >
              <input type="file" ref="scaleInput" accept=".xls,.xlsx" @change="onScaleFileInput" />
              <div class="drop-icon">📂</div>
              <h3>{{ store.state.fileName || 'Clique ou arraste o arquivo' }}</h3>
              <p v-if="!store.state.fileName">Formatos: .xls, .xlsx</p>
              <button v-if="!store.state.fileName" class="btn-upload" @click.stop.prevent="triggerScaleInput">Selecionar arquivo</button>
            </div>

            <div class="file-ok" v-if="store.state.fileOk">✅ Arquivo de voos carregado!</div>

            <div class="actions-section" v-if="store.state.fileOk">
              <button 
                class="btn-gerar" 
                :disabled="store.state.isUploading" 
                @click="handleImportScale"
              >
                <span v-if="store.state.isUploading">⏳ Enviando...</span>
                <span v-else>⚡ Importar e Gerar Editor</span>
              </button>
            </div>
          </div>

          <!-- Form 2: Escala de Trabalho (Disponibilidade) -->
          <div class="upload-card">
            <div class="card-header">
              <span class="card-icon">📅</span>
              <h2>Escala de Trabalho</h2>
              <p>Importar disponibilidade mensal (CLT/Solo)</p>
            </div>

            <div
              class="drop-zone"
              :class="{ 'drag-over': draggingWork }"
              @click.prevent="triggerWorkInput"
              @dragover.prevent="draggingWork = true"
              @dragleave.prevent="draggingWork = false"
              @drop.prevent="onDropWork"
            >
              <input type="file" ref="workInput" accept=".xls,.xlsx" @change="onWorkFileInput" />
              <div class="drop-icon">📑</div>
              <h3>{{ store.state.workFileName || 'Clique ou arraste a escala' }}</h3>
              <p v-if="!store.state.workFileName">Formatos: .xls, .xlsx</p>
              <button v-if="!store.state.workFileName" class="btn-upload" @click.stop.prevent="triggerWorkInput">Selecionar arquivo</button>
            </div>

            <div class="file-ok work-ok" v-if="store.state.workFileOk">✅ Escala de trabalho carregada!</div>

            <div class="actions-section" v-if="store.state.workFileOk">
              <button 
                class="btn-gerar btn-work" 
                :disabled="store.state.isUploading" 
                @click="handleImportWork"
              >
                <span v-if="store.state.isUploading">⏳ Enviando...</span>
                <span v-else>💾 Sincronizar Calendário</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="store.state.uploadError" class="upload-error">
          ❌ {{ store.state.uploadError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import iconUrl from '../icons/icon-192.png'
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const store = inject('store')
const router = useRouter()

onMounted(() => {
  store.fetchInvas()
  store.fetchBars()
  store.fetchStatuses()
})

const draggingScale = ref(false)
const scaleInput = ref(null)
const draggingWork = ref(false)
const workInput = ref(null)

function triggerScaleInput() { scaleInput.value?.click() }
function onScaleFileInput(e) { const f = e.target.files?.[0]; if (f) store.onFile(f) }
function onDropScale(e) { draggingScale.value = false; const f = e.dataTransfer?.files?.[0]; if (f) store.onFile(f) }

function triggerWorkInput() { workInput.value?.click() }
function onWorkFileInput(e) { const f = e.target.files?.[0]; if (f) store.onWorkFile(f) }
function onDropWork(e) { draggingWork.value = false; const f = e.dataTransfer?.files?.[0]; if (f) store.onWorkFile(f) }

async function handleImportScale() {
  const res = await store.importScale()
  if (res.success) router.push('/editor')
}

async function handleImportWork() {
  const res = await store.importWorkSchedule()
  if (res.success) {
    alert('Escala de trabalho importada com sucesso!')
    store.state.workFileName = ''
    store.state.workFileOk = false
  }
}

function handleBackToEditor() { router.push('/editor') }
function handleOpenCalendar() { router.push('/calendar') }
</script>

<style scoped>
.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.upload-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.card-header {
  text-align: center;
  margin-bottom: 20px;
}
.card-icon {
  font-size: 24px;
  background: #fff;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.card-header h2 {
  font-size: 16px;
  font-weight: bold;
  color: #1d2951;
  margin: 0;
}
.card-header p {
  font-size: 11px;
  color: #64748b;
  margin: 4px 0 0;
}
.upload-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #721c24;
  margin-top: 24px;
  text-align: center;
}
.screen-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f0f4f8;
}
.upload-screen {
  max-width: 900px;
  width: 100%;
}
.up-header {
  background: #1d2951;
  color: #fff;
  padding: 16px 24px;
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
.up-header h1 {
  font-size: 17px;
  font-weight: bold;
  margin: 0;
}
.up-header p {
  margin: 2px 0 0;
  font-size: 11px;
  opacity: 0.8;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.btn-calendar, .btn-logout {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}
.btn-logout { background: rgba(231, 76, 60, 0.2); border-color: rgba(231, 76, 60, 0.4); }
.up-body {
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 30px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  background: #fff;
}
.drop-zone.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}
.drop-zone input { display: none; }
.drop-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.5; }
.drop-zone h3 { font-size: 14px; color: #334155; font-weight: bold; margin-bottom: 6px; }
.drop-zone p { font-size: 11px; color: #94a3b8; }
.btn-upload {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
.file-ok {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 10px;
  font-size: 11px;
  color: #065f46;
  margin-bottom: 16px;
  text-align: center;
}
.work-ok { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
.btn-gerar {
  width: 100%;
  background: #1d2951;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.btn-gerar:hover { background: #2c3e50; }
.btn-work { background: #3b82f6; }
.btn-work:hover { background: #2563eb; }
</style>
