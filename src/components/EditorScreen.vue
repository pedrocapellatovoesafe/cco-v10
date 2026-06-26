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
        @auto-fill="handleAutoFill"
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

      <AutoFillPreviewModal
        :is-open="isAutoFillModalOpen"
        :suggestions="autoFillSuggestions"
        @close="isAutoFillModalOpen = false"
        @confirm="confirmAutoFill"
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
import AutoFillPreviewModal from './AutoFillPreviewModal.vue'

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
      store.fetchStatuses(),
      store.fetchRestricoes()
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

// Auto-fill simulation and heuristic matching logic
const isAutoFillModalOpen = ref(false)
const autoFillSuggestions = ref([])

const getSimulatedAlerts = (proposedSlot, currentTempSch) => {
  const originalValue = store.SCH.value
  store.SCH.value = currentTempSch
  const alerts = store.getSlotAlerts(proposedSlot)
  store.SCH.value = originalValue
  return alerts
}

const checkProposedRestrictions = (proposedSlot, restricts) => {
  if (!restricts || restricts.length === 0) return []
  
  const getVal = (o, k) => {
    if (!o) return null
    return o[k] ?? o[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] ?? o[k.toLowerCase()] ?? null
  }
  const getInvaId = (o) => getVal(o, 'invaId') || o.inva?.id || null
  const getAlunoId = (o) => getVal(o, 'alunoId') || o.aluno?.id || null
  const getMissaoId = (o) => getVal(o, 'missaoId') || o.missao?.id || null
  const getAeId = (o) => getVal(o, 'aeronaveId') || o.aeronave?.id || null
  const getModId = (o) => getVal(o, 'modeloAeronaveId') || o.modeloAeronave?.id || o.aeronave?.modeloAeronaveId || o.aeronave?.modeloAeronave?.id || null
  
  const slotAlunoId = proposedSlot.alunoId
  const slotInvaId = proposedSlot.invaId
  const slotMissaoId = proposedSlot.missaoId
  const slotAeId = proposedSlot.aeronaveId
  const slotModId = proposedSlot.modeloId

  return restricts.filter(r => {
    const isA = r.isAluno || r.is_aluno
    const isI = r.isInvalida || r.is_invalida || r.isInva || r.is_inva
    const isM = r.isMissao || r.is_missao
    const isAe = r.isAeronave || r.is_aeronave
    const isMod = r.isModelo || r.is_modelo

    if (isA && String(slotAlunoId) !== String(getAlunoId(r))) return false
    if (isI && String(slotInvaId) !== String(getInvaId(r))) return false
    if (isM && String(slotMissaoId) !== String(getMissaoId(r))) return false
    if (isAe && String(slotAeId) !== String(getAeId(r))) return false
    if (isMod && String(slotModId) !== String(getModId(r))) return false

    return true
  })
}

const getInvaRealHours = (invaName, voosRealizados, startDate, endDate) => {
  if (!invaName || !voosRealizados) return 0
  const matchedVoos = voosRealizados.filter(voo => {
    const vInst = (voo.invaRelation?.nome || voo.instrutor || '').toUpperCase().trim()
    const iName = invaName.toUpperCase().trim()
    const matchName = vInst && (iName.includes(vInst) || vInst.includes(iName))
    if (!matchName) return false
    
    const vooDate = voo.data ? voo.data.substring(0, 10) : ''
    if (startDate && vooDate < startDate) return false
    if (endDate && vooDate > endDate) return false
    
    return true
  })
  const totalMins = matchedVoos.reduce((sum, voo) => sum + (parseFloat(voo.tempoTotalVoo) || 0), 0)
  return totalMins / 60
}

const getInvaScheduledHours = (invaName, startDate, endDate) => {
  if (!invaName) return 0
  const technicalImpediments = ['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE', 'CANCELADO']
  
  const slots = store.state.parsedSlots || []
  const matchedSlots = slots.filter(s => {
    const matchInva = s.inva && s.inva.toUpperCase().trim() === invaName.toUpperCase().trim()
    const hasStudent = !!s.aluno
    const isNotImpediment = s.st && !technicalImpediments.includes(s.st.toUpperCase().trim())
    
    if (!matchInva || !hasStudent || !isNotImpediment) return false
    
    let slotDateStr = ''
    if (s.data) {
      const [d, m, y] = s.data.split('/')
      slotDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    
    if (startDate && slotDateStr < startDate) return false
    if (endDate && slotDateStr > endDate) return false
    
    return true
  })
  
  return (matchedSlots.length * 90) / 60
}

const findBestInvaForSlot = (slot, tempSch, voosRealizados, startDate, endDate) => {
  // Use getInvasByBarra from store
  const eligibleInvas = store.getInvasByBarra(slot.barra)
  if (eligibleInvas.length === 0) return null
  
  let bestCandidate = null
  let bestScore = Infinity
  let bestAlerts = []
  
  // Convert slot time to numeric hours
  const hv = (hora) => {
    const m = hora && hora.match(/^(\d+):(\d+)/)
    return m ? +m[1] + +m[2] / 60 : 0
  }
  
  for (const inva of eligibleInvas) {
    let score = 0
    
    // 1. Check availability
    const dispState = store.availabilityState(inva.nome)
    const isAvail = dispState === 'avail' || dispState === 'weekend-avail' || dispState === 'sobreaviso'
    if (!isAvail) {
      score += 1000 // High penalty for unavailability
    }
    
    // 2. Check simultaneous conflict
    const isAlreadyAllocatedSameHour = tempSch.some(other => 
      other.invaId === inva.id && 
      other.hora === slot.hora && 
      other.id !== slot.id && 
      other.aluno
    )
    if (isAlreadyAllocatedSameHour) {
      score += 2000 // Critical conflict: simultaneous allocation
    }
    
    // 3. Base matching bonus
    const invaBase = inva.base?.nome || inva.base || ''
    const slotBase = slot.base || ''
    if (invaBase.toUpperCase() === slotBase.toUpperCase()) {
      score -= 2
    }
    
    // 4. Consecutive instructor bonus (keep instructor with student or aircraft)
    const timeVal = hv(slot.hora)
    const hasConsecutiveSession = tempSch.some(other => {
      if (other.invaId !== inva.id) return false
      const otherTime = hv(other.hora)
      const isAdjacent = Math.abs(timeVal - otherTime - 2) < 0.1 || Math.abs(otherTime - timeVal - 2) < 0.1
      return isAdjacent && (other.aluno === slot.aluno || other.ae === slot.ae)
    })
    if (hasConsecutiveSession) {
      score -= 10
    }
    
    // 5. Evaluate warnings using the validation engine
    const proposedSlot = { ...slot, inva: inva.nome, invaId: inva.id }
    
    // Insert proposed slot into tempSch temporarily
    const indexInTemp = tempSch.findIndex(x => x.id === slot.id)
    const originalTempSlot = tempSch[indexInTemp]
    tempSch[indexInTemp] = proposedSlot
    
    const alerts = getSimulatedAlerts(proposedSlot, tempSch)
    
    // Restore
    tempSch[indexInTemp] = originalTempSlot
    
    alerts.forEach(alert => {
      if (alert.includes('Limite de Jornada') || alert.includes('Conflito Simultâneo') || alert.includes('Indisponibilidade')) {
        score += 500
      } else {
        score += 10
      }
    })
    
    // 6. Prefer larger difference (planned - flown) and fewer flown hours
    const flown = getInvaRealHours(inva.nome, voosRealizados, startDate, endDate)
    const scheduled = getInvaScheduledHours(inva.nome, startDate, endDate)
    const difference = scheduled - flown
    
    // Prefer larger difference (scheduled - flown) and fewer flown hours
    score -= difference * 0.5
    score += flown * 0.5
    
    // Check for server restrictions on the proposed allocation
    const activeRestricts = checkProposedRestrictions(proposedSlot, store.state.RESTRICTS)
    if (activeRestricts.length > 0) {
      score += 10000 // Huge penalty for restrictions
    }
    const restrictAlerts = activeRestricts.map(r => `Restrição: ${r.nome || 'Impedimento Operacional'}`)
    const allAlerts = [...alerts, ...restrictAlerts]
    
    if (score < bestScore) {
      bestScore = score
      bestCandidate = inva
      bestAlerts = allAlerts
    }
  }
  
  return bestCandidate ? { inva: bestCandidate, alerts: bestAlerts, score: bestScore } : null
}

const handleAutoFill = async () => {
  isLoading.value = true
  let voosRealizados = []
  try {
    const results = await Promise.all([
      store.fetchVoosRealizados(),
      store.fetchRestricoes()
    ])
    voosRealizados = results[0] || []
  } catch (err) {
    console.error('Error fetching data for auto-fill:', err)
  } finally {
    isLoading.value = false
  }
  
  // Calculate current month date window based on store.state.currentViewDate
  let y, m
  const dateVal = store.currentViewDate.value || store.currentViewDate
  if (dateVal) {
    const match = dateVal.match(/^(\d{4})-(\d{2})/)
    if (match) {
      y = parseInt(match[1], 10)
      m = parseInt(match[2], 10)
    }
  }
  if (!y || !m) {
    const today = new Date()
    y = today.getFullYear()
    m = today.getMonth() + 1
  }
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const tempSch = store.state.SCH.map(s => ({ ...s }))
  const targetSlots = tempSch.filter(s => s.aluno && !s.invaId)
  
  // Sort chronologically by hour
  const sortedTargets = [...targetSlots].sort((a, b) => {
    const timeA = a.hora.split(':').map(Number)
    const timeB = b.hora.split(':').map(Number)
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
  })
  
  const suggestions = []
  
  for (const slot of sortedTargets) {
    const result = findBestInvaForSlot(slot, tempSch, voosRealizados, startDate, endDate)
    if (result && result.inva) {
      const indexInTemp = tempSch.findIndex(x => x.id === slot.id)
      tempSch[indexInTemp].inva = result.inva.nome
      tempSch[indexInTemp].invaId = result.inva.id
      
      suggestions.push({
        slotId: slot.id,
        barra: slot.barra,
        hora: slot.hora,
        aluno: slot.aluno,
        ae: slot.ae,
        originalInva: slot.inva || '—',
        suggestedInva: result.inva.nome,
        suggestedInvaId: result.inva.id,
        alerts: result.alerts
      })
    }
  }
  
  autoFillSuggestions.value = suggestions
  isAutoFillModalOpen.value = true
}

const confirmAutoFill = async (approvedSuggestions) => {
  isAutoFillModalOpen.value = false
  isLoading.value = true
  try {
    const promises = []
    const targets = approvedSuggestions || autoFillSuggestions.value
    for (const sugg of targets) {
      const slotObj = store.state.SCH.find(s => s.id === sugg.slotId)
      if (slotObj) {
        slotObj.inva = sugg.suggestedInva
        slotObj.invaId = sugg.suggestedInvaId
        
        // Update status to 'AGUARDANDO CONFIRMAÇÃO'
        const statusName = 'AGUARDANDO CONFIRMAÇÃO'
        const statusObj = store.state.STATUSES.find(x => x.nome && x.nome.toUpperCase() === statusName)
        if (statusObj) {
          slotObj.st = statusName
          slotObj.statusSlotId = statusObj.id
        }
        
        promises.push(store.updateSlot(slotObj, false))
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises)
      await store.fetchSlots()
      store.generateEditor()
      showToast('Escala preenchida com sucesso!', 'success')
    } else {
      showToast('Nenhuma alocação pendente de atualização.', 'info')
    }
  } catch (err) {
    showToast('Erro ao atualizar escala automaticamente.', 'danger')
  } finally {
    isLoading.value = false
    store.state.globalLoading = false
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
  background: var(--bg-main);
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
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  width: 40px; height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.editor-screen { width: 100%; max-width: 1380px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.footer { margin-top: 18px; font-size: 11px; color: #5a6370; border-top: 1px solid #dde4ef; padding-top: 14px; display: flex; justify-content: space-between; }
.footer-badge { background: var(--primary); color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 999px; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 10px 18px; border-radius: 10px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
.toast-success { background: #e6f7ed; border: 1px solid #27ae60; border-left: 5px solid #27ae60; }
.toast-danger { background: #fdf2f2; border: 1px solid #c0392b; border-left: 5px solid #c0392b; }
</style>
