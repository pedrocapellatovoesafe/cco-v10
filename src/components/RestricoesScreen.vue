<template>
  <div class="screen-layout">
    <div id="rest-screen" class="restricoes-screen">
      <RestrictionHeader @back="handleBackToEditor" @logout="handleLogout" />

      <div class="rest-grid">
        <RestrictionForm 
          :editing-item="editingItem"
          @save="handleSave"
          @cancel-edit="editingItem = null"
          @add-to-batch="handleAddToBatch"
        />

        <RestrictionList 
          :batch-list="batchList"
          :is-saving-batch="isSavingBatch"
          @edit="handleEditRequest"
          @delete="handleDelete"
          @bulk-delete="handleBulkDelete"
          @save-batch="showConfirmModal = true"
          @cancel-batch="batchList = []"
          @remove-group-from-batch="handleRemoveGroupFromBatch"
        />
      </div>

      <!-- Toast Notification -->
      <div v-if="toast.show" :class="['toast-notification', `toast-${toast.type}`]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '⚠️' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>

      <!-- Custom Confirmation Modal -->
      <transition name="fade">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
          <div class="modal-content">
            <div class="modal-header">
              <h3>⚠️ Confirmar Salvamento em Lote</h3>
            </div>
            <div class="modal-body">
              <p>Você está prestes a salvar <strong>{{ batchList.length }}</strong> restrições de uma vez.</p>
              <p>Deseja continuar com esta operação?</p>
            </div>
            <div class="modal-footer">
              <button class="btn-modal-cancel" @click="showConfirmModal = false">Cancelar</button>
              <button class="btn-modal-confirm" @click="confirmSaveBatch">Sim, Salvar Tudo</button>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RestrictionHeader from './RestrictionHeader.vue'
import RestrictionForm from './RestrictionForm.vue'
import RestrictionList from './RestrictionList.vue'

const router = useRouter()
const store = inject('store')

const editingItem = ref(null)
const batchList = ref([])
const isSavingBatch = ref(false)
const showConfirmModal = ref(false)
const toast = reactive({ show: false, message: '', type: 'success' })

function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await Promise.all([
      store.fetchInvas(),
      store.fetchAlunos(),
      store.fetchAeronaves(),
      store.fetchModelos(),
      store.fetchMissoes(),
      store.fetchRestricoes()
    ])
  } finally {
    store.state.globalLoading = false
  }
})

function handleEditRequest(item) {
  editingItem.value = item
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleAddToBatch(items) {
  const currentBatch = [...batchList.value]
  let addedCount = 0
  
  items.forEach(newItem => {
    // Unique key for a restriction: (invaId OR aeronaveId OR modeloId) + missaoId
    const isDuplicate = currentBatch.some(oldItem => 
      (String(oldItem.invaId) == String(newItem.invaId) && String(oldItem.missaoId) == String(newItem.missaoId) && !!newItem.invaId && !!newItem.missaoId) ||
      (String(oldItem.aeronaveId) == String(newItem.aeronaveId) && String(oldItem.missaoId) == String(newItem.missaoId) && !!newItem.aeronaveId && !!newItem.missaoId) ||
      (String(oldItem.modeloAeronaveId) == String(newItem.modeloAeronaveId) && String(oldItem.missaoId) == String(newItem.missaoId) && !!newItem.modeloAeronaveId && !!newItem.missaoId) ||
      (String(oldItem.invaId) == String(newItem.invaId) && String(oldItem.modeloAeronaveId) == String(newItem.modeloAeronaveId) && !!newItem.invaId && !!newItem.modeloAeronaveId)
    )
    if (!isDuplicate) {
      currentBatch.push(newItem)
      addedCount++
    }
  })
  
  batchList.value = currentBatch
  if (addedCount > 0) {
    showToast(`${addedCount} novas restrições adicionadas ao lote. Total: ${currentBatch.length}.`, 'success')
  } else {
    showToast('Nenhuma restrição nova (já estão no lote ou na base).', 'info')
  }
}

function handleRemoveGroupFromBatch(group) {
  const getCleanName = (nome) => {
    let n = nome
      .replace(/^\[Preset.*?\]\s+.*?\s+-\s+Restrição\s+/, '')
      .replace(/^Restrição automática:\s+Instrutor de Solo\s+\((.*)\)$/, '$1')
      .replace(/^\[Preset AE\]\s+.*?\s+-\s+(.*?)\s+\((.*)\)$/, '$1 ($2)')
    if (n.includes(' - Restrição ')) n = n.split(' - Restrição ').pop()
    return n
  }
  
  const targetKey = (item) => `${item.missaoId}-${item.aeronaveId}-${item.modeloAeronaveId}-${item.invaId}-${item.isAeronave}-${item.isInva}-${getCleanName(item.nome)}`
  const targetGroupKey = targetKey(group)
  batchList.value = batchList.value.filter(item => targetKey(item) !== targetGroupKey)
}

async function confirmSaveBatch() {
  showConfirmModal.value = false
  isSavingBatch.value = true
  try {
    const res = await store.importRestrictions(batchList.value)
    if (res.success) {
      showToast(`Processamento concluído: ${batchList.value.length} restrições importadas com sucesso!`, 'success')
      batchList.value = []
    } else {
      showToast(res.error || 'Erro ao importar restrições em lote', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao processar lote.', 'danger')
  } finally {
    isSavingBatch.value = false
  }
}

async function handleSave(data) {
  const { id, nome, observacao, selectedType, form } = data
  const payload = {
    nome, observacao,
    isInva: false, isAluno: false, isAlunoInva: false, isModelo: false, isAeronave: false, isMissao: false
  }

  if (selectedType === 'aluno_inva') {
    payload.alunoId = form.alunoId; payload.invaId = form.invaId; payload.isAlunoInva = true;
  } else if (selectedType === 'ae_missao') {
    payload.aeronaveId = form.aeronaveId; payload.missaoId = form.missaoId; payload.isAeronave = true; payload.isMissao = true;
  } else if (selectedType === 'inva_missao') {
    payload.invaId = form.invaId; payload.missaoId = form.missaoId; payload.isInva = true; payload.isMissao = true;
  } else if (selectedType === 'inva_modelo') {
    payload.invaId = form.invaId; payload.modeloAeronaveId = form.modeloAeronaveId; payload.isInva = true; payload.isModelo = true;
  } else if (selectedType === 'mod_missao') {
    payload.modeloAeronaveId = form.modeloAeronaveId; payload.missaoId = form.missaoId; payload.isModelo = true; payload.isMissao = true;
  } else if (selectedType === 'inva_only') {
    payload.invaId = form.invaId; payload.isInva = true;
  } else if (selectedType === 'aluno_only') {
    payload.alunoId = form.alunoId; payload.isAluno = true;
  }

  try {
    let res
    if (id) res = await store.updateRestriction(id, payload)
    else res = await store.saveRestriction(payload)

    if (res.success) {
      showToast(id ? 'Restrição atualizada!' : 'Restrição criada!', 'success')
      editingItem.value = null
    } else {
      showToast(res.error || 'Erro ao processar restrição', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao salvar.', 'danger')
  }
}

async function handleDelete(id) {
  if (!confirm('Deseja excluir esta regra de restrição?')) return
  const res = await store.deleteRestriction(id)
  if (res.success) showToast('Restrição removida.', 'success')
  else showToast('Erro ao remover.', 'danger')
}

async function handleBulkDelete(ids) {
  if (!confirm(`Deseja excluir as ${ids.length} restrições selecionadas?`)) return
  try {
    const res = await store.bulkDeleteRestrictions(ids)
    if (res.success) showToast(`${ids.length} restrições excluídas com sucesso.`, 'success')
    else showToast(res.error || 'Erro ao excluir em lote.', 'danger')
  } catch (e) {
    showToast('Erro técnico ao processar exclusão em lote.', 'danger')
  }
}

function handleBackToEditor() { router.push('/editor') }
function handleLogout() { store.logout(); router.push('/login') }
</script>

<style scoped>
.screen-layout { min-height: 100vh; padding: 24px; background: #f0f4f8; }
.restricoes-screen { width: 100%; max-width: 1200px; margin: 0 auto; }
.rest-grid { display: grid; grid-template-columns: 420px 1fr; gap: 24px; align-items: start; }

/* Toast */
.toast-notification {
  position: fixed; top: 24px; right: 24px; padding: 14px 22px; border-radius: 12px;
  z-index: 6000; display: flex; gap: 12px; align-items: center; box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }

/* Modal Confirmation */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  z-index: 7000; backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff; width: 100%; max-width: 450px; border-radius: 20px;
  overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.modal-header { padding: 20px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 17px; color: #1d2951; font-weight: 800; }
.modal-body { padding: 24px; text-align: center; }
.modal-body p { margin: 0 0 12px; color: #475569; font-size: 15px; line-height: 1.5; }
.modal-body strong { color: #1d2951; }
.modal-footer { padding: 20px 24px; display: flex; gap: 12px; background: #f8fafc; }
.btn-modal-cancel {
  flex: 1; padding: 12px; background: #fff; color: #64748b; border: 1px solid #cbd5e1;
  border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-modal-cancel:hover { background: #f1f5f9; color: #1d2951; }
.btn-modal-confirm {
  flex: 1; padding: 12px; background: #1d2951; color: #fff; border: none;
  border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-modal-confirm:hover { background: #2a3b59; transform: translateY(-1px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
