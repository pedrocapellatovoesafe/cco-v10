<template>
  <div class="screen-layout">
    <!-- Loading Overlay with Blur -->
    <div v-if="isLoading || store.state.globalLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>{{ isLoading ? 'Sincronizando dados com o servidor...' : 'Salvando alterações...' }}</p>
    </div>

    <div id="editor-screen" class="editor-screen">
      <!-- Topbar with Título, Filtros e Controles inline -->
      <div class="topbar">
        <div class="title-section">
          <img :src="iconUrl" alt="SAFE" />
          <h1>{{ store.state.editorTitle }}</h1>
        </div>
        
        <div class="date-filters">
          <div class="filter-field">
            <label>Início:</label>
            <input type="date" v-model="store.filterStartDate.value" class="date-input" />
          </div>
          <div class="filter-field">
            <label>Fim:</label>
            <input type="date" v-model="store.filterEndDate.value" class="date-input" />
          </div>
          <button class="btn-filter" @click="handleFilter">🔍 Filtrar</button>
        </div>

        <div class="controls">
          <button class="btn-back" @click="handleOpenCalendar">📅 Calendário</button>
          <button class="btn-back" @click="() => router.push('/restricoes')">🛠️ Restrições</button>
          <button class="btn-back" @click="() => router.push('/upload')">📂 Base de dados</button>
          <button class="btn-logout-editor" @click="handleLogout">Sair</button>
        </div>
      </div>

      <!-- Disponibilidade Panel -->
      <div class="panels">
        <div class="panel-box">
          <h3>Disponibilidade</h3>
          <div class="disp-panel">
            <div class="disp-group" v-for="base in ['SJK', 'CPQ']" :key="base">
              <div class="disp-group-label">{{ base }}</div>
              <div class="disp-sections">
                <div class="disp-section">
                  <span class="disp-section-title">Voo:</span>
                  <div class="disp-chips">
                    <span
                      v-for="instr in (store.availabilityGroups?.value?.[base]?.voo || [])"
                      :key="instr.nome"
                      class="ic"
                      :class="store.availabilityClass(instr.nome)"
                      @click="store.toggleDisp(instr.nome)"
                      :title="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
                    >
                      {{ instr.nome ? instr.nome.split(' ')[0] : '—' }}
                    </span>
                  </div>
                </div>
                <div class="disp-section">
                  <span class="disp-section-title">Solo:</span>
                  <div class="disp-chips">
                    <span
                      v-for="instr in (store.availabilityGroups?.value?.[base]?.solo || [])"
                      :key="instr.nome"
                      class="ic ic-static"
                      :class="store.availabilityClass(instr.nome)"
                      :title="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
                    >
                      {{ instr.nome ? instr.nome.split(' ')[0] : '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Pagination (Escalas Disponíveis) -->
      <div class="date-pagination" v-if="store.availableDates.value.length > 0">
        <div class="pag-label">Escalas disponíveis:</div>
        <div class="pag-btns">
          <button 
            v-for="date in store.availableDates.value" 
            :key="date"
            :class="['date-btn', store.currentViewDate.value === date ? 'active' : '']"
            @click="store.setCurrentViewDate(date)"
          >
            {{ date }}
          </button>
        </div>
      </div>

      <!-- Tabs Base -->
      <div class="tabs">
        <button :class="['tab-btn', store.state.activeTab === 'SJK' ? 't-sjk' : '']" @click="store.state.activeTab = 'SJK'">✈ SJK</button>
        <button :class="['tab-btn', store.state.activeTab === 'CPQ' ? 't-cpq' : '']" @click="store.state.activeTab = 'CPQ'">✈ CPQ</button>
      </div>

      <!-- Editor Grid -->
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
                <div v-if="label === 'Aluno'" class="sc" :class="slot.aluno ? '' : 'sc-empty'">
                  <button v-if="slot.apiId" class="btn-delete-slot" @click.stop="openDeleteModal(slot)" title="Excluir Registro">×</button>
                  <div class="sv sv-aluno">
                    <input 
                      v-if="slot.apiId"
                      type="checkbox" 
                      v-model="slot.isChecked" 
                      @change="onCheckedChange(slot)"
                      class="slot-checkbox"
                      title="Marcar como conferido"
                    />
                    <span v-if="slot.aluno">{{ slot.aluno }}</span>
                    <span v-else-if="slot.apiId" class="warning-text">ALUNO NÃO INFORMADO</span>
                  </div>
                </div>
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
                  <template v-if="slot.apiId">
                    <select class="slot-input" v-model="slot.st" @change="onStatusChange(slot.id, slot.st)">
                      <option v-for="st in store.state.STATUSES" :key="st.id" :value="st.nome.toUpperCase()">
                        {{ st.nome.toUpperCase() }}
                      </option>
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

      <!-- Modal de Detalhes / Restrições -->
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
              <p><strong>Observações:</strong> {{ selectedSlot?.obs }}</p>
            </div>
            
            <div class="modal-restrictions-list" v-if="selectedSlot && selectedSlot.serverRestrictions && selectedSlot.serverRestrictions.length > 0">
              <div v-for="(rest, idx) in selectedSlot.serverRestrictions" :key="'res-' + idx" class="modal-restrict-item">
                <span class="restrict-icon">🚫</span>
                <div class="restrict-content">
                  <span class="restrict-title">{{ rest.nome }}</span>
                  <p class="restrict-desc">{{ rest.observacao }}</p>
                </div>
              </div>
            </div>

            <div class="modal-alerts-list" v-if="selectedSlot && store.getSlotAlerts(selectedSlot).length > 0">
              <div v-for="(alert, idx) in store.getSlotAlerts(selectedSlot)" :key="'alt-' + idx" class="modal-alert-item">
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

      <!-- Modal de Confirmação de Exclusão -->
      <div v-if="isDeleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-danger">
          <div class="modal-header">
            <h3>Excluir Registro</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </div>
          <div class="modal-body text-center">
            <div class="danger-icon">🗑️</div>
            <p>Deseja realmente excluir o registro de <strong>{{ slotToDelete?.aluno || 'Aluno não informado' }}</strong>?</p>
            <p class="text-muted">Esta ação não poderá ser desfeita.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDeleteModal">Cancelar</button>
            <button class="btn-confirm-delete" @click="confirmDeleteSlot">Confirmar Exclusão</button>
          </div>
        </div>
      </div>

      <!-- Toast Notifications -->
      <div v-if="toast.show" :class="['toast-notification', `toast-${toast.type}`]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '⚠️' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const isLoading = ref(true)

const toast = reactive({
  show: false,
  message: '',
  type: 'success'
})

function showToast(message, type = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

function handleOpenCalendar() {
  router.push('/calendar')
}

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      store.fetchSlots(),
      store.fetchBars(),
      store.fetchAeronaves(),
      store.fetchInvas(),
      store.fetchAlunos(),
      store.fetchModelos(),
      store.fetchMissoes(),
      store.fetchStatuses()
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

const isDeleteModalOpen = ref(false)
const slotToDelete = ref(null)

async function handleFilter() {
  isLoading.value = true
  try {
    await store.fetchSlots()
    store.generateEditor()
    showToast('Escala filtrada com sucesso!', 'success')
  } catch (e) {
    showToast('Erro ao filtrar escala.', 'danger')
  } finally {
    isLoading.value = false
  }
}

function openDeleteModal(slot) {
  slotToDelete.value = slot
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  slotToDelete.value = null
}

async function confirmDeleteSlot() {
  if (!slotToDelete.value?.apiId) return
  const id = slotToDelete.value.apiId
  closeDeleteModal()
  try {
    await store.deleteSlot(id)
    showToast('Registro excluído com sucesso!', 'success')
  } catch (e) {
    showToast('Erro ao excluir registro.', 'danger')
  }
}

async function onInstructorChange(slotId, value) {
  try {
    await store.updateSlotInstructor(slotId, value)
    showToast('Instrutor atualizado!', 'success')
  } catch (e) {
    showToast('Erro ao atualizar instrutor.', 'danger')
  }
}

async function onAeronaveChange(slotId, value) {
  try {
    await store.updateSlotAeronave(slotId, value)
    showToast('Aeronave atualizada!', 'success')
  } catch (e) {
    showToast('Erro ao atualizar aeronave.', 'danger')
  }
}

async function onStatusChange(slotId, value) {
  try {
    await store.updateSlotStatus(slotId, value)
    showToast('Status atualizado!', 'success')
  } catch (e) {
    showToast('Erro ao atualizar status.', 'danger')
  }
}

async function onCheckedChange(slot) {
  try {
    await store.updateSlotChecked(slot.id, slot.isChecked)
    showToast(slot.isChecked ? 'Slot marcado!' : 'Slot desmarcado!', 'success')
  } catch (e) {
    showToast('Erro ao atualizar conferência.', 'danger')
  }
}

function slotCellClass(slot) {
  return store.getSlotClass(slot)
}

function buttonLabel(slot) {
  if (slot.serverRestrictions && slot.serverRestrictions.length > 0) return 'Restrição'
  const alerts = store.getSlotAlerts(slot)
  if (alerts.length > 0) return 'Atenção'
  if (!slot.aluno) return slot.st || 'Disponível'
  return 'Ok'
}

function buttonClass(slot) {
  const label = buttonLabel(slot)
  if (label === 'Restrição') return 'btn-mod-err'
  if (label === 'Atenção') return 'btn-mod-wrn'
  if (!slot.aluno) return 'btn-disp'
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

function onDragOver(id) {}
function onDragLeave(id) {}

async function onDropSlot(id) {
  if (!dragSourceId.value || dragSourceId.value === id) return
  try {
    await store.swapSlots(dragSourceId.value, id)
    showToast('Troca realizada com sucesso!', 'success')
  } catch (e) {
    showToast('Erro ao realizar troca.', 'danger')
  }
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
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(240, 244, 248, 0.4);
  backdrop-filter: blur(5px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 5000;
}
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1d2951;
  border-radius: 50%;
  width: 40px; height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.editor-screen { width: 100%; max-width: 1380px; margin: 0 auto; }

.topbar {
  display: flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;
  gap: 16px; padding: 10px 20px; background: #fff; border: 1px solid #dae2ec; border-radius: 14px;
  box-shadow: 0 8px 24px rgba(14, 38, 72, 0.06);
}
.title-section { display: flex; align-items: center; gap: 10px; flex: 1 1 0; min-width: 0; }
.title-section img { width: 28px; height: 28px; border-radius: 50%; opacity: 0.9; }
.topbar h1 { font-size: 14px; font-weight: 700; color: #1d2951; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.date-filters {
  display: flex; align-items: center; gap: 10px; background: #f8f9fa;
  padding: 5px 12px; border-radius: 10px; border: 1px solid #e3e9f0;
}
.filter-field { display: flex; align-items: center; gap: 6px; }
.filter-field label { font-size: 11px; font-weight: 700; color: #5a6370; text-transform: uppercase; }
.date-input { border: 1px solid #d8dee8; border-radius: 6px; padding: 4px 8px; font-size: 12px; color: #1d2951; }
.btn-filter { background: #1d2951; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }

.date-pagination {
  display: flex; align-items: center; gap: 12px; margin: 14px 0; padding: 10px 18px;
  background: #fff; border: 1px solid #dae2ec; border-radius: 14px;
}
.pag-label { font-size: 12px; font-weight: 700; color: #1d2951; }
.pag-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.date-btn {
  border: 1px solid #dae2ec; background: #fff; color: #5a6370; padding: 6px 14px;
  border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.date-btn:hover { border-color: #1d2951; color: #1d2951; }
.date-btn.active { background: #1d2951; color: #fff; border-color: #1d2951; }

.controls { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex: 1 1 0; }
.btn-back, .btn-logout-editor {
  border: none; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
}
.btn-back { background: #1d3a52; color: #fff; }
.btn-logout-editor { background: #c0392b; color: #fff; }

.panels { margin-bottom: 16px; }
.panel-box { padding: 18px; background: #fff; border: 1px solid #dae2ec; border-radius: 16px; }
.panel-box h3 { margin: 0 0 14px; font-size: 12px; font-weight: 700; color: #1d2951; text-transform: uppercase; }
.disp-group-label { display: inline-block; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: #1d2951; }
.disp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.disp-sections { display: flex; flex-direction: column; gap: 12px; }
.disp-section { display: flex; align-items: flex-start; gap: 10px; }
.disp-section-title { font-size: 10px; font-weight: 800; color: #5a6370; text-transform: uppercase; margin-top: 6px; min-width: 35px; }
.ic { font-size: 10px; padding: 5px 8px; border-radius: 999px; font-weight: 700; cursor: pointer; color: #fff; }
.ic-static { cursor: default; }
.ic.avail { background: #27ae60; }
.ic.folga-reg { background: #c0392b; }
.ic.folga-soc { background: #e67e22; }
.ic.sobreaviso { background: #f1c40f; color: #000; }
.ic.treinamento { background: #3498db; }
.ic.ferias { background: #9b59b6; }
.ic.banco { background: #1abc9c; }
.ic.operacoes { background: #34495e; }
.ic.externo { background: #7f8c8d; }
.ic.medica { background: #000000; }
.ic.outro { background: #bdc3c7; color: #000; }

.tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.tab-btn { padding: 10px 22px; font-size: 13px; font-weight: 700; border: none; border-radius: 999px; background: #d4d4d4; cursor: pointer; }
.tab-btn.t-sjk { background: #1d2951; color: #fff; }
.tab-btn.t-cpq { background: #1d3a52; color: #fff; }

.barra-bloco { border-radius: 18px; overflow: hidden; box-shadow: 0 16px 30px rgba(14, 38, 72, 0.08); margin-bottom: 18px; }
.bh { display: grid; background: #1d2951; color: #fff; font-weight: 700; }
.hd { padding: 14px 16px; min-width: 110px; }
.hh { display: flex; align-items: center; justify-content: center; padding: 14px 6px; border-left: 1px solid rgba(255, 255, 255, 0.16); font-size: 13px; }
.barra-body { background: #fff; }
.brow { display: grid; min-height: 48px; border-bottom: 1px solid #e3e9f0; }
.rl { padding: 14px 12px; background: #f6f8fb; font-size: 12px; font-weight: 700; color: #2a3b59; border-right: 1px solid #dde4ef; display: flex; align-items: center; }
.sc { border-right: 1px solid #dde4ef; display: flex; align-items: center; justify-content: center; padding: 4px 6px; position: relative; }
.sc-empty, .sc-filled, .sc-st-agua, .sc-st-other { background: #fff !important; }

.slot-input {
  width: 100%;
  height: 36px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #fff !important;
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
.btn-delete-slot { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; background: #ff4d4d; color: white; border-radius: 50%; border: none; cursor: pointer; z-index: 30; }
.btn-row { display: grid; background: #f5f8fc; border-top: 1px solid #dde4ef; }
.bcell { padding: 8px 6px; }
.btn-cav { width: 100%; height: 36px; border: none; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: #fff !important; }
.btn-mod-ok { background: #27ae60; }
.btn-mod-wrn { background: #f1c40f; color: #fff !important; }
.btn-mod-err { background: #c0392b; }
.btn-disp { background: #1d2951; }

.footer { margin-top: 18px; font-size: 11px; color: #5a6370; border-top: 1px solid #dde4ef; padding-top: 14px; display: flex; justify-content: space-between; }
.footer-badge { background: #1d2951; color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 999px; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 450px; border-radius: 16px; overflow: hidden; }
.modal-header { padding: 18px 22px; background: #f8f9fa; display: flex; align-items: center; justify-content: space-between; }
.modal-close {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s ease;
}
.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1d2951;
}
.modal-body { padding: 22px; }
.modal-slot-info {
  background: #f0f4f8;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.modal-slot-info p {
  margin: 6px 0;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.4;
}
.modal-alert-item { display: flex; gap: 12px; padding: 12px; background: #fff9e6; border-left: 4px solid #f39c12; border-radius: 6px; margin-bottom: 10px; }
.modal-restrict-item {
  display: flex; gap: 12px; padding: 14px; background: #fef2f2; 
  border-left: 5px solid #ef4444; border-radius: 8px; margin-bottom: 12px;
}
.restrict-icon { font-size: 18px; margin-top: 2px; }
.restrict-title { display: block; font-weight: 800; color: #991b1b; font-size: 14px; margin-bottom: 4px; }
.restrict-desc { margin: 0; font-size: 13px; color: #b91c1c; line-height: 1.4; opacity: 0.9; }

.modal-footer { padding: 16px 22px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
.btn-modal-ok { background: #1d2951; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-modal-ok:hover { background: #2a3b59; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 10px 18px; border-radius: 10px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
.toast-success { background: #e6f7ed; border: 1px solid #27ae60; border-left: 5px solid #27ae60; }
.toast-danger { background: #fdf2f2; border: 1px solid #c0392b; border-left: 5px solid #c0392b; }
</style>
