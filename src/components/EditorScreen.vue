<template>
  <div class="screen-layout">
    <!-- Loading Overlay with Blur -->
    <div v-if="isLoading || store.state.globalLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>{{ isLoading ? 'Sincronizando dados com o servidor...' : 'Salvando alterações...' }}</p>
    </div>

    <div id="editor-screen" class="editor-screen">
      <EditorTopbar 
        @filter="handleFilter"
        @open-calendar="handleOpenCalendar"
        @logout="handleLogout"
      />

      <AvailabilityPanel />

      <SlotGrid 
        @open-delete-modal="openDeleteModal"
        @open-detail-modal="openDetailModal"
        @open-create-modal="openCreateModal"
        @update-instructor="onInstructorChange"
        @update-aeronave="onAeronaveChange"
        @update-status="onStatusChange"
        @update-checked="onCheckedChange"
        @swap-slots="handleSwapSlots"
      />

      <div class="footer">
        <span>CCO · Editor de Escala v10 · SAFE Aviation School</span>
        <span class="footer-badge">Node.js</span>
      </div>

      <SlotDetailModal 
        :is-open="isModalOpen"
        :slot="selectedSlot"
        @close="closeModal"
      />

      <SlotDeleteModal 
        :is-open="isDeleteModalOpen"
        :slot="slotToDelete"
        @close="closeDeleteModal"
        @confirm="confirmDeleteSlot"
      />

      <FlightCreateModal 
        :is-open="isCreateModalOpen"
        :slot="slotToCreate"
        @close="closeCreateModal"
        @save="handleSaveFlight"
      />

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
import EditorTopbar from './EditorTopbar.vue'
import AvailabilityPanel from './AvailabilityPanel.vue'
import SlotGrid from './SlotGrid.vue'
import SlotDetailModal from './SlotDetailModal.vue'
import SlotDeleteModal from './SlotDeleteModal.vue'
import FlightCreateModal from './FlightCreateModal.vue'

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
    if (store.currentViewDate.value) {
      store.setCurrentViewDate(store.currentViewDate.value)
    } else {
      store.generateEditor()
    }
  } finally {
    store.generateEditor()
    isLoading.value = false
  }
})

const isModalOpen = ref(false)
const selectedSlot = ref(null)

const isDeleteModalOpen = ref(false)
const slotToDelete = ref(null)

const isCreateModalOpen = ref(false)
const slotToCreate = ref(null)

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

function openDetailModal(slot) {
  selectedSlot.value = slot
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  selectedSlot.value = null
}

function openDeleteModal(slot) {
  slotToDelete.value = slot
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  slotToDelete.value = null
}

function openCreateModal(slot) {
  slotToCreate.value = slot
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  slotToCreate.value = null
}

function handleSaveFlight() {
  showToast('Voo cadastrado com sucesso!', 'success')
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

async function handleSwapSlots(id1, id2) {
  try {
    await store.swapSlots(id1, id2)
    showToast('Troca realizada com sucesso!', 'success')
  } catch (e) {
    showToast('Erro ao realizar troca.', 'danger')
  }
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

.editor-screen { width: 100%; max-width: 1380px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.footer { margin-top: 18px; font-size: 11px; color: #5a6370; border-top: 1px solid #dde4ef; padding-top: 14px; display: flex; justify-content: space-between; }
.footer-badge { background: #1d2951; color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 999px; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 10px 18px; border-radius: 10px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
.toast-success { background: #e6f7ed; border: 1px solid #27ae60; border-left: 5px solid #27ae60; }
.toast-danger { background: #fdf2f2; border: 1px solid #c0392b; border-left: 5px solid #c0392b; }
</style>
