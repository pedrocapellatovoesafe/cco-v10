<template>
  <div class="screen-layout">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Sincronizando dados com o servidor...</p>
    </div>
    <div id="editor-screen" class="editor-screen" v-else>
      <div class="topbar">
        <img :src="iconUrl" alt="SAFE" style="width:28px;height:28px;border-radius:50%;opacity:.85;" />
        <h1>{{ store.state.editorTitle }}</h1>
        <div class="controls">
          <button class="btn-reset" @click="store.resetSchedule">↺ Reset</button>
          <button class="btn-back" @click="() => router.push('/upload')">📂 Nova escala</button>
          <button class="btn-logout-editor" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="panels">
        <div class="panel-box"><h3>Disponibilidade</h3><div class="disp-panel">
          <div class="disp-group" v-for="base in ['SJK', 'CPQ']" :key="base">
            <div class="disp-group-label">{{ base }}</div>
            <div class="disp-chips">
              <span
                v-for="instr in (store.availabilityGroups?.value?.[base]?.voo || [])"
                :key="instr.nome"
                class="ic"
                :class="store.availabilityClass(instr.nome)"
                @click="store.toggleDisp(instr.nome)"
                :title="instr.nome"
              >
                {{ instr.nome ? instr.nome.split(' ')[0] : '—' }}
              </span>
            </div>
          </div>
        </div></div>
      </div>

      <div class="tabs">
        <button :class="['tab-btn', store.state.activeTab === 'SJK' ? 't-sjk' : '']" @click="store.state.activeTab = 'SJK'">✈ SJK</button>
        <button :class="['tab-btn', store.state.activeTab === 'CPQ' ? 't-cpq' : '']" @click="store.state.activeTab = 'CPQ'">✈ CPQ</button>
      </div>

      <div class="tab-panel active">
        <div v-for="block in (store.scheduleBlocks?.value?.[store.state.activeTab] || [])" :key="block.id" class="barra-bloco">
          <div class="bh" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
            <div class="hd"><div class="d1">{{ store.state.parsedDate }}</div><div class="d2">{{ store.state.parsedDayName }}</div></div>
            <div v-for="slot in (block.slots || [])" :key="slot.id" class="hh" draggable="true"
              @dragstart="onDragStart(slot.id)"
              @dragend="onDragEnd"
              @dragover.prevent="onDragOver(slot.id)"
              @dragleave="onDragLeave(slot.id)"
              @drop.prevent="onDropSlot(slot.id)"
            >
              {{ slot.hora }} <span class="drag-indicator">⠿</span>
            </div>
          </div>
          <div class="barra-body">
            <div class="brow" v-for="label in rowLabels" :key="label" :style="{ gridTemplateColumns: `110px repeat(${(block.slots || []).length}, 1fr)` }">
              <div class="rl">{{ label }}</div>
              <template v-for="slot in (block.slots || [])" :key="slot.id + label">
                <div v-if="label === 'Aluno'" class="sc" :class="slot.aluno ? '' : 'sc-empty'"><div class="sv">{{ slot.aluno }}</div></div>
                <div v-else-if="label === 'Instrutor'" :class="slotCellClass(slot)">
                  <select class="slot-input" v-model="slot.inva" @change="onInstructorChange(slot.id, slot.inva)">
                    <option value="">—</option>
                    <option v-for="inva in (store.getInvasByBarra ? store.getInvasByBarra(slot.barra, slot.inva) : [])" :key="inva.id" :value="inva.nome">
                      {{ inva.nome }}
                    </option>
                  </select>
                </div>
                <div v-else-if="label === 'Aeronave'" class="sc">
                  <select class="slot-input" v-model="slot.ae" @change="onAeronaveChange(slot.id, slot.ae)">
                    <option value="">—</option>
                    <option v-for="aero in (store.getAeronavesByBarra ? store.getAeronavesByBarra(slot.barra, slot.ae) : [])" :key="aero.id" :value="aero.nome">
                      {{ aero.nome }}
                    </option>
                  </select>
                </div>
                <div v-else-if="label === 'Missão'" class="sc" :class="slot.missao ? '' : 'sc-empty'"><div class="sv">{{ slot.missao }}</div></div>
                <div v-else-if="label === 'Status'" class="sc">
                  <template v-if="slot.aluno">
                    <select class="slot-input" v-model="slot.st" @change="onStatusChange(slot.id, slot.st)">
                      <option value="CONFIRMADO">CONFIRMADO</option>
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="AGUARDANDO CONFIRMAÇÃO">AGUARDANDO CONFIRMAÇÃO</option>
                      <option value="REVISÃO">REVISÃO</option>
                      <option value="OPERAÇÕES">OPERAÇÕES</option>
                      <option value="METEOROLOGIA">METEOROLOGIA</option>
                      <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                      <option value="INDISPONIBILIDADE">INDISPONIBILIDADE</option>
                    </select>
                  </template>
                </div>
                <div v-else-if="label === 'Barra'" class="sc"><div class="sv">{{ slot.barra }}</div></div>
              </template>
            </div>
          </div>

          <div class="btn-row" :style="{ gridTemplateColumns: `110px repeat(${(block.slots || []).length}, 1fr)` }">
            <div class="bl"></div>
            <div v-for="slot in (block.slots || [])" :key="slot.id + '-btn'" class="bcell">
              <div class="btn-container">
                <button class="btn-cav" :class="buttonClass(slot)" @click="handleButtonClick(slot)">
                  {{ buttonLabel(slot) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <span>CCO · Editor de Escala v10 · SAFE Aviation School</span>
        <span class="footer-badge">Node.js</span>
      </div>

      <!-- Modal de Restrições -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚠️ Detalhes da Escala</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-slot-info">
              <p><strong>Hora:</strong> {{ selectedSlot?.hora }}</p>
              <p><strong>Barra:</strong> {{ selectedSlot?.barra }}</p>
              <p><strong>Aluno:</strong> {{ selectedSlot?.aluno }}</p>
              <p><strong>Status Atual:</strong> {{ selectedSlot?.st }}</p>
              <p><strong>Observações: {{ selectedSlot?.obs }}</strong> </p>
            </div>
            
            <div class="modal-alerts-list" v-if="selectedSlot && store.getSlotAlerts(selectedSlot).length > 0">
              <div v-for="(alert, idx) in store.getSlotAlerts(selectedSlot)" :key="idx" class="modal-alert-item">
                <span class="alert-icon">⚠️</span>
                <span class="alert-text">{{ alert }}</span>
              </div>
            </div>
            <div class="modal-placeholder" v-else-if="buttonLabel(selectedSlot) === 'Restrição'">
              <p>Este slot possui uma restrição operacional ou técnica ({{ selectedSlot?.st }}).</p>
            </div>
            <div class="modal-placeholder" v-else>
              <p>Nenhuma inconsistência detectada.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal-ok" @click="closeModal">Entendido</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const isLoading = ref(true)

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      store.fetchSlots(),
      store.fetchBars(),
      store.fetchAeronaves(),
      store.fetchInvas()
    ])
    store.generateEditor()
  } finally {
    isLoading.value = false
  }
})
const dragSourceId = ref(null)
const rowLabels = ['Aluno', 'Instrutor', 'Aeronave', 'Missão', 'Status', 'Barra']

const isModalOpen = ref(false)
const selectedSlot = ref(null)

function onInstructorChange(slotId, value) {
  store.updateSlotInstructor(slotId, value)
}

function onAeronaveChange(slotId, value) {
  store.updateSlotAeronave(slotId, value)
}

function onStatusChange(slotId, value) {
  store.updateSlotStatus(slotId, value)
}

function slotCellClass(slot) {
  return store.getSlotClass(slot)
}

function buttonLabel(slot) {
  if (!slot.aluno) return slot.st || 'Disponível'
  
  const alerts = store.getSlotAlerts(slot)
  if (alerts.length > 0) return 'Atenção'
  
  return 'Ok'
}

function buttonClass(slot) {
  if (!slot.aluno) return 'btn-disp'
  const label = buttonLabel(slot)
  if (label === 'Atenção') return 'btn-mod-wrn'
  if (label === 'Restrição') return 'btn-mod-err'
  return 'btn-mod-ok'
}

function handleButtonClick(slot) {
  const label = buttonLabel(slot)
  if (label === 'Atenção' || label === 'Restrição') {
    selectedSlot.value = slot
    isModalOpen.value = true
  }
}

function closeModal() {
  isModalOpen.value = false
  selectedSlot.value = null
}

function onDragStart(id) {
  dragSourceId.value = id
}

function onDragEnd() {
  dragSourceId.value = null
}

function onDragOver(id) {
  // logic to allow drop
}

function onDragLeave(id) {
  // logic
}

function onDropSlot(id) {
  if (!dragSourceId.value || dragSourceId.value === id) return
  store.swapSlots(dragSourceId.value, id)
  dragSourceId.value = null
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
  position: relative;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(240, 244, 248, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 14px;
}
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1d2951;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.editor-screen {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 14px;
  box-shadow: 0 16px 32px rgba(14, 38, 72, 0.08);
}
.topbar img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  opacity: 0.9;
}
.topbar h1 {
  font-size: 17px;
  font-weight: 700;
  color: #1d2951;
  margin: 0;
  letter-spacing: 0.02em;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
}
.btn-reset,
.btn-back,
.btn-logout-editor {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-reset { background: #888; color: #fff; }
.btn-reset:hover { background: #666; transform: translateY(-1px); }
.btn-back { background: #1d3a52; color: #fff; }
.btn-back:hover { background: #162e42; transform: translateY(-1px); }
.btn-logout-editor {
  background: #c0392b;
  color: #fff;
}
.btn-logout-editor:hover { background: #a93226; transform: translateY(-1px); }
.panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 16px;
}
.panel-box {
  padding: 18px 18px 16px;
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 16px;
}
.panel-box h3 {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #1d2951;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.disp-group { margin-bottom: 18px; }
.disp-group-label {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #1d2951;
  letter-spacing: 0.04em;
}
.disp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ic {
  font-size: 10px;
  padding: 5px 8px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}
.ic-ok { background: #d4edda; color: #155724; }
.ic-folga { background: #fdecea; color: #7b1a19; text-decoration: line-through; }
.ic-cond { background: #fef9e7; color: #856404; }
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}
.tab-btn {
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  border-radius: 999px;
  background: #d4d4d4;
  color: #1b1b1b;
  cursor: pointer;
  transition: background 0.15s ease;
}
.tab-btn.t-sjk { background: #1d2951; color: #fff; }
.tab-btn.t-cpq { background: #1d3a52; color: #fff; }
.tab-panel.active { display: block; }
.barra-bloco {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 30px rgba(14, 38, 72, 0.08);
  margin-bottom: 18px;
}
.bh {
  display: grid;
  background: #1d2951;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
.bh .hd {
  padding: 14px 16px;
  min-width: 110px;
}
.bh .d1 { font-size: 14px; }
.bh .d2 { font-size: 12px; opacity: 0.9; }
.hh {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  font-size: 13px;
}
.drag-indicator { opacity: 0.45; font-size: 10px; margin-left: 6px; }
.barra-body { background: #fff; }
.brow {
  display: grid;
  min-height: 48px;
  border-bottom: 1px solid #e3e9f0;
  align-items: stretch;
}
.brow:last-child { border-bottom: none; }
.rl {
  padding: 14px 12px;
  background: #f6f8fb;
  font-size: 12px;
  font-weight: 700;
  color: #2a3b59;
  border-right: 1px solid #dde4ef;
  display: flex;
  align-items: center;
}
.sc {
  border-right: 1px solid #dde4ef;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px 6px;
}
.sc:last-child { border-right: none; }
.sc-empty { background: #fff; }
.sc-filled { background: #fff; }
.sc-st-agua { background: #fff; }
.sc-st-other { background: #fff; }
.slot-input {
  width: 100%;
  height: 36px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #fdfdfd;
  font-size: 11.5px;
  font-family: inherit;
  padding: 0 10px;
  color: #1d2951;
  cursor: pointer;
  outline: none;
  text-align: center;
  text-align-last: center;
  transition: all 0.2s ease;
}
.slot-input:focus {
  border-color: #5baee2;
  background: #f5fbff;
  box-shadow: 0 0 0 3px rgba(91, 174, 226, 0.15);
}
.slot-input:hover {
  border-color: #b8c2d1;
}
select.slot-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231d2951' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  padding-right: 28px;
}
.sv {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  padding: 10px 8px;
  width: 100%;
  line-height: 1.3;
  word-break: break-word;
}
.locked {
  color: #1a4a80;
  font-weight: 700;
  font-size: 11px;
}
.btn-row {
  display: grid;
  background: #f5f8fc;
  border-top: 1px solid #dde4ef;
}
.bl { min-height: 4px; }
.bcell {
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-cav {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.btn-mod-ok { background: #27ae60; color: #fff; }
.btn-mod-wrn { background: #f39c12; color: #fff; }
.btn-mod-err { background: #c0392b; color: #fff; }
.btn-disp { background: #1d2951; color: #fff; }
.footer {
  margin-top: 18px;
  font-size: 11px;
  color: #5a6370;
  border-top: 1px solid #dde4ef;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.footer-badge {
  background: #1d2951;
  color: #fff;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff;
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalIn 0.3s ease-out;
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal-header {
  padding: 18px 22px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1d2951;
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}
.modal-close:hover { color: #333; }
.modal-body {
  padding: 22px;
}
.modal-slot-info {
  background: #f0f4f8;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 18px;
}
.modal-slot-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #444;
}
.modal-placeholder {
  text-align: center;
  padding: 20px 10px;
  color: #666;
  font-style: italic;
  font-size: 14px;
}
.modal-footer {
  padding: 16px 22px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}
.btn-modal-ok {
  background: #1d2951;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
.btn-modal-ok:hover { background: #2a3b59; }

.modal-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #fff9e6;
  border-left: 4px solid #f39c12;
  border-radius: 6px;
}
.alert-icon {
  font-size: 16px;
  margin-top: 2px;
}
.alert-text {
  font-size: 13.5px;
  color: #5a4b00;
  line-height: 1.4;
  font-weight: 500;
}
</style>
