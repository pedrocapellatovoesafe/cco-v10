<template>
  <div class="screen-layout">
    <div class="config-module">
      <div class="module-header">
        <div class="title-area">
          <h1>📊 Configuração de Barras (Slots)</h1>
          <p>Gerencie as colunas da escala e seus horários de operação</p>
        </div>
        <div class="header-actions">
          <button class="btn-back-nav" @click="router.push('/configuracoes')">← Voltar</button>
        </div>
      </div>

      <div class="module-grid">
        <!-- Listagem de Barras -->
        <div class="list-card">
          <div class="card-header">
            <div class="search-box">
              <input type="text" v-model="searchQuery" placeholder="🔍 Buscar barra..." class="search-input" />
            </div>
            <button class="btn-add" @click="createNew">➕ Nova Barra</button>
          </div>
          
          <div class="card-body scrollable">
            <div v-if="filteredBars.length === 0" class="empty-list">
              Nenhuma barra encontrada.
            </div>
            <div v-for="bar in filteredBars" :key="bar.id" 
                 :class="['bar-item', selectedBar?.id === bar.id ? 'active' : '', bar.ativo === 0 ? 'inactive-bar' : '']"
                 @click="selectBar(bar)">
              <div class="bar-info">
                <div class="bar-title-row">
                  <span class="bar-name">{{ bar.nome }}</span>
                  <span v-if="bar.ativo === 0" class="badge-inactive">INATIVA</span>
                </div>
                <div class="bar-tags">
                  <span class="tag-base">{{ bar.base?.nome }}</span>
                  <span class="tag-model">{{ bar.modeloAeronave?.nome }}</span>
                  <span class="tag-count">{{ bar.horarios?.length || 0 }} Horários</span>
                </div>
              </div>
              <div class="bar-actions">
                <button class="btn-delete-small" @click.stop="confirmDeleteBar(bar)" title="Excluir Barra">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Edição de Barra e Horários -->
        <div class="form-card">
          <div class="card-header">
            <h3>{{ isEditing ? '✏️ Editar Barra' : '✨ Nova Barra' }}</h3>
          </div>
          <div class="card-body scrollable-form">
            <div class="form-container">
              <!-- Dados da Barra -->
              <div class="form-section">
                <div class="form-group">
                  <label>Nome da Barra (Ex: MC-01 SJK #1):</label>
                  <input type="text" v-model="form.nome" placeholder="Nome identificador" class="form-input" />
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label>Base:</label>
                    <select v-model="form.baseId" class="form-select">
                      <option :value="null" disabled>Selecione a base</option>
                      <option v-for="base in store.BASES.value" :key="base.id" :value="base.id">{{ base.nome }}</option>
                    </select>
                  </div>
                  <div class="form-group flex-1">
                    <label>Modelo Aeronave:</label>
                    <select v-model="form.modeloAeronaveId" class="form-select">
                      <option :value="null" disabled>Selecione o modelo</option>
                      <option v-for="mod in store.MODELOS.value" :key="mod.id" :value="mod.id">{{ mod.nome }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Status da Barra:</label>
                  <div class="horario-status">
                    <label class="switch">
                      <input type="checkbox" v-model="form.ativo">
                      <span class="slider round"></span>
                    </label>
                    <span class="status-label">{{ form.ativo ? 'Barra Ativa (Visível no Editor)' : 'Barra Inativa (Oculta no Editor)' }}</span>
                  </div>
                </div>

                <div class="form-actions-main">
                  <button class="btn-save-main" @click="handleSaveBar" :disabled="isSaving || !isValidBar">
                    {{ isSaving ? 'Processando...' : (isEditing ? 'Atualizar Barra' : 'Criar Barra') }}
                  </button>
                  <button v-if="isEditing" class="btn-cancel-main" @click="createNew">Cancelar</button>
                </div>
              </div>

              <!-- Gestão de Horários (Apenas se já existir a barra) -->
              <div v-if="isEditing" class="horarios-section">
                <div class="section-header">
                  <h4>⏰ Horários desta Barra</h4>
                  <div class="header-tools">
                    <label class="show-inactive-toggle">
                      <input type="checkbox" v-model="showInactiveSchedules">
                      <span>Ver Inativos</span>
                    </label>
                    <button class="btn-add-time" @click="showAddTime = true">➕ Add Horário</button>
                  </div>
                </div>

                <!-- Input rápido para adicionar horário -->
                <div v-if="showAddTime" class="add-time-box">
                  <input type="time" v-model="newTime" class="time-input" />
                  <button class="btn-confirm-time" @click="handleAddHorario" :disabled="!newTime">Salvar</button>
                  <button class="btn-cancel-time" @click="showAddTime = false">X</button>
                </div>

                <div class="horarios-list">
                  <div v-if="!selectedBar.horarios || selectedBar.horarios.length === 0" class="empty-times">
                    Nenhum horário cadastrado.
                  </div>
                  <div v-for="h in sortedHorarios" :key="h.id" 
                       :class="['horario-row', !h.ativo ? 'is-inactive' : '']">
                    <input type="time" v-model="h.hora" class="time-input-inline" @change="handleUpdateHorario(h)" />
                    <div class="horario-status">
                      <label class="switch">
                        <input type="checkbox" :checked="!!h.ativo" @change="toggleHorario(h)">
                        <span class="slider round"></span>
                      </label>
                      <span class="status-label">{{ h.ativo ? 'Ativo' : 'Inativo' }}</span>
                    </div>
                    <button class="btn-del-time" @click="handleDeleteHorario(h)" title="Remover Permanentemente">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div v-if="toast.show" :class="['toast-notification', `toast-${toast.type}`]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '⚠️' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>

      <!-- Modal de Confirmação -->
      <div v-if="confirmModal.show" class="modal-overlay">
        <div class="confirm-modal">
          <div class="confirm-icon">⚠️</div>
          <h3>{{ confirmModal.title }}</h3>
          <p>{{ confirmModal.message }}</p>
          <div class="confirm-actions">
            <button class="btn-confirm-delete" @click="confirmModal.onConfirm">Sim, Confirmar</button>
            <button class="btn-confirm-cancel" @click="confirmModal.show = false">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const searchQuery = ref('')
const selectedBar = ref(null)
const isSaving = ref(false)
const isEditing = ref(false)
const showAddTime = ref(false)
const newTime = ref('')
const showInactiveSchedules = ref(false)

const form = reactive({
  id: null,
  nome: '',
  baseId: null,
  modeloAeronaveId: null,
  ativo: true
})

const confirmModal = reactive({ show: false, title: '', message: '', onConfirm: null })

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const filteredBars = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return (store.BARRAS.value || []).filter(b => 
    b.nome.toLowerCase().includes(query) || 
    (b.base?.nome || '').toLowerCase().includes(query)
  )
})

const sortedHorarios = computed(() => {
  if (!selectedBar.value?.horarios) return []
  let list = [...selectedBar.value.horarios]
  if (!showInactiveSchedules.value) {
    list = list.filter(h => !!h.ativo)
  }
  return list.sort((a, b) => a.hora.localeCompare(b.hora))
})

const isValidBar = computed(() => form.nome.length > 2 && form.baseId && form.modeloAeronaveId)

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await Promise.all([
      store.fetchBars(),
      store.fetchBases(),
      store.fetchModelos()
    ])
  } finally {
    store.state.globalLoading = false
  }
})

function createNew() {
  isEditing.value = false
  selectedBar.value = null
  form.id = null; form.nome = ''; form.baseId = null; form.modeloAeronaveId = null
  showAddTime.value = false; newTime.value = ''
}

async function selectBar(bar) {
  isEditing.value = true
  selectedBar.value = bar
  form.id = bar.id
  form.nome = bar.nome
  form.baseId = bar.baseId || bar.base?.id
  form.modeloAeronaveId = bar.modeloAeronaveId || bar.modeloAeronave?.id
  form.ativo = bar.ativo !== 0 // backend might send 0/1
  
  // Fetch full detail to get all schedules (including inactive)
  const detail = await store.fetchBarDetail(bar.id)
  if (detail) selectedBar.value = detail
}

async function handleSaveBar() {
  if (!isValidBar.value) return
  isSaving.value = true
  const payload = { 
    nome: form.nome, 
    baseId: form.baseId, 
    modeloAeronaveId: form.modeloAeronaveId,
    ativo: form.ativo ? 1 : 0
  }
  
  try {
    const res = isEditing.value ? await store.updateBarra(form.id, payload) : await store.saveBarra(payload)
    if (res.success) {
      showToast(isEditing.value ? 'Barra atualizada!' : 'Barra criada!', 'success')
      if (!isEditing.value) await selectBar(res.data)
      else await store.fetchBars()
    } else {
      showToast(res.error || 'Erro ao salvar barra', 'danger')
    }
  } finally {
    isSaving.value = false
  }
}

function confirmDeleteBar(bar) {
  confirmModal.title = 'Excluir Barra'
  confirmModal.message = `Deseja realmente excluir a barra ${bar.nome}? Isso removerá todos os seus horários.`
  confirmModal.onConfirm = async () => {
    confirmModal.show = false
    const res = await store.deleteBarra(bar.id)
    if (res.success) {
      showToast('Barra excluída!')
      if (selectedBar.value?.id === bar.id) createNew()
    }
  }
  confirmModal.show = true
}

async function handleAddHorario() {
  if (!newTime.value) return
  const res = await store.saveHorario({ barraId: selectedBar.value.id, hora: newTime.value, ativo: 1 })
  if (res.success) {
    showToast('Horário adicionado!')
    newTime.value = ''; showAddTime.value = false
    await refreshSelectedBar()
  }
}

async function handleUpdateHorario(h) {
  const res = await store.updateHorario(h.id, { hora: h.hora, ativo: h.ativo })
  if (res.success) {
    showToast('Horário atualizado')
    await refreshSelectedBar()
  } else {
    showToast(res.error || 'Erro ao atualizar horário', 'danger')
  }
}

async function toggleHorario(h) {
  h.ativo = h.ativo ? 0 : 1
  await handleUpdateHorario(h)
}

async function handleDeleteHorario(h) {
  if (!confirm('Excluir este horário?')) return
  const res = await store.deleteHorario(h.id)
  if (res.success) {
    showToast('Horário removido')
    await refreshSelectedBar()
  }
}

async function refreshSelectedBar() {
  const detail = await store.fetchBarDetail(selectedBar.value.id)
  if (detail) selectedBar.value = detail
  await store.fetchBars() // Update list count
}
</script>

<style scoped>
.screen-layout { padding: 24px; background: var(--bg-main); min-height: 100vh; }
.config-module { width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

.module-header {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--primary); color: #fff; padding: 20px 28px; border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-bottom: 4px solid var(--secondary);
}
.title-area h1 { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; }
.title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
.btn-back-nav { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }

.module-grid { display: grid; grid-template-columns: 1fr 500px; gap: 24px; }

.list-card, .form-card { background: #fff; border-radius: 16px; border: 1px solid #dae2ec; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; }

.card-header { padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; font-size: 15px; color: var(--primary); font-weight: 800; }

.search-box { flex: 1; margin-right: 16px; }
.search-input { width: 100%; padding: 8px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 13px; outline: none; }
.btn-add { background: var(--secondary); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; }

.card-body { padding: 20px; }
.scrollable { max-height: 700px; overflow-y: auto; padding: 12px; }
.scrollable-form { max-height: 700px; overflow-y: auto; }

.bar-item {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px;
  cursor: pointer; transition: all 0.2s;
}
.bar-item:hover { border-color: var(--primary); transform: translateX(4px); }
.bar-item.active { border-color: var(--primary); background: #f0f7ff; }
.bar-item.inactive-bar { opacity: 0.6; background: #f8fafc; border-style: dashed; }

.bar-title-row { display: flex; align-items: center; gap: 8px; }
.badge-inactive { font-size: 9px; font-weight: 800; background: #64748b; color: #fff; padding: 2px 6px; border-radius: 4px; }

.bar-name { font-size: 14px; font-weight: 700; color: var(--primary); }
.bar-tags { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.tag-base, .tag-model, .tag-count { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
.tag-base { background: #e0f2fe; color: #0369a1; }
.tag-model { background: #fef9c3; color: #854d0e; }
.tag-count { background: #f1f5f9; color: #475569; }

.btn-delete-small { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.4; }
.btn-delete-small:hover { opacity: 1; }

.form-container { display: flex; flex-direction: column; gap: 24px; padding: 4px; }
.form-section { padding-bottom: 20px; border-bottom: 2px dashed #f1f5f9; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: var(--primary); }
.form-input, .form-select { width: 100%; padding: 10px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 14px; outline: none; }
.form-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }

.form-actions-main { display: flex; gap: 10px; margin-top: 10px; }
.btn-save-main { flex: 1; padding: 12px; background: var(--secondary); color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-cancel-main { padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* Horários */
.horarios-section { display: flex; flex-direction: column; gap: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-header h4 { margin: 0; font-size: 14px; color: var(--primary); }
.header-tools { display: flex; align-items: center; gap: 16px; }
.show-inactive-toggle { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer; }
.show-inactive-toggle input { cursor: pointer; }

.btn-add-time { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }

.add-time-box { background: #f8fafc; padding: 12px; border-radius: 10px; display: flex; gap: 8px; align-items: center; border: 1px solid #e2e8f0; }
.time-input { padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; }
.btn-confirm-time { background: var(--secondary); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }

.horarios-list { display: flex; flex-direction: column; gap: 8px; }
.horario-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; transition: all 0.2s; }
.horario-row.is-inactive { background: #f8fafc; opacity: 0.6; border-style: dashed; }
.horario-row.is-inactive .time-input-inline { color: #94a3b8; }
.time-input-inline { border: none; font-size: 14px; font-weight: 700; color: var(--primary); width: 70px; background: transparent; }
.horario-status { display: flex; align-items: center; gap: 8px; flex: 1; }
.status-label { font-size: 11px; font-weight: 600; color: #94a3b8; }

.btn-del-time { background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.3; }
.btn-del-time:hover { opacity: 1; color: #c0392b; }

/* Switch Style */
.switch { position: relative; display: inline-block; width: 34px; height: 18px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: var(--secondary); }
input:focus + .slider { box-shadow: 0 0 1px var(--secondary); }
input:checked + .slider:before { transform: translateX(16px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

.empty-list, .empty-times { text-align: center; padding: 20px; color: #94a3b8; font-style: italic; font-size: 13px; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 12px 20px; border-radius: 12px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 7000; }
.confirm-modal { background: #fff; padding: 32px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 48px; margin-bottom: 16px; }
.confirm-modal h3 { margin: 0 0 12px; color: var(--primary); font-size: 18px; font-weight: 800; }
.confirm-modal p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 12px; }
.btn-confirm-delete { flex: 1; padding: 12px; background: #c0392b; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
.btn-confirm-cancel { flex: 1; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

@media (max-width: 1000px) {
  .module-grid { grid-template-columns: 1fr; }
}
</style>
