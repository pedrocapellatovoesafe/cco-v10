<template>
  <div class="screen-layout">
    <div class="config-module">
      <div class="module-header">
        <div class="title-area">
          <h1>👨‍✈️ Gestão de Instrutores</h1>
          <p>Cadastre e gerencie os instrutores de voo e solo</p>
        </div>
        <div class="header-actions">
          <button class="btn-back-nav" @click="router.push('/configuracoes')">← Voltar</button>
        </div>
      </div>

      <div class="module-grid">
        <!-- Listagem de Instrutores -->
        <div class="list-card">
          <div class="card-header">
            <div class="search-box">
              <input type="text" v-model="searchQuery" placeholder="🔍 Buscar instrutor..." class="search-input" />
            </div>
            <button class="btn-add" @click="createNew">➕ Novo Instrutor</button>
          </div>
          
          <div class="card-body scrollable">
            <div v-if="filteredInvas.length === 0" class="empty-list">
              Nenhum instrutor encontrado.
            </div>
            <div v-for="inva in filteredInvas" :key="inva.id" 
                 :class="['inva-item', selectedInva?.id === inva.id ? 'active' : '']"
                 @click="selectInva(inva)">
              <div class="inva-info">
                <span class="inva-name">{{ inva.nome }}</span>
                <div class="inva-details">
                  <span class="inva-cell">{{ inva.celular || '(Sem celular)' }}</span>
                </div>
                <div class="inva-tags">
                  <span class="tag-base">{{ inva.base?.nome || 'Sem Base' }}</span>
                  <span :class="['tag-sit', getSitClass(inva.situacaoInva?.nome)]">
                    {{ getSitLabel(inva.situacaoInva?.nome) }}
                  </span>
                </div>
              </div>
              <div class="inva-actions">
                <button class="btn-delete-small" @click.stop="handleDelete(inva)" title="Excluir">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Edição/Criação -->
        <div class="form-card">
          <div class="card-header">
            <h3>{{ isEditing ? '✏️ Editar: ' + form.nome : '✨ Novo Instrutor' }}</h3>
          </div>
          <div class="card-body">
            <div class="form-container">
              <div class="form-group">
                <label>Nome Completo:</label>
                <input type="text" v-model="form.nome" placeholder="Ex: JOÃO DA SILVA" class="form-input" />
              </div>

              <div class="form-group">
                <label>Celular / WhatsApp:</label>
                <input type="text" v-model="form.celular" placeholder="Ex: (11) 99999-9999" class="form-input" />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Base Operacional:</label>
                  <select v-model="form.baseId" class="form-select">
                    <option :value="null" disabled>Selecione uma base</option>
                    <option v-for="base in store.BASES.value" :key="base.id" :value="base.id">
                      {{ base.nome }}
                    </option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label>Situação:</label>
                  <select v-model="form.situacaoInvaId" class="form-select">
                    <option :value="null" disabled>Selecione uma situação</option>
                    <option v-for="sit in store.SITUACOES.value" :key="sit.id" :value="sit.id">
                      {{ getSitLabel(sit.nome) }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-save" @click="handleSave" :disabled="isSaving || !isValid">
                  {{ isSaving ? 'Salvando...' : 'Salvar Instrutor' }}
                </button>
                <button class="btn-cancel" @click="cancelEdit" :disabled="isSaving">
                  Cancelar
                </button>
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

      <!-- Modal de Confirmação de Exclusão -->
      <div v-if="confirmModal.show" class="modal-overlay">
        <div class="confirm-modal">
          <div class="confirm-icon">⚠️</div>
          <h3>Confirmar Exclusão</h3>
          <p>Deseja realmente excluir o instrutor <strong>{{ confirmModal.inva?.nome }}</strong>? Esta ação não pode ser desfeita.</p>
          <div class="confirm-actions">
            <button class="btn-confirm-delete" @click="executeDelete" :disabled="isSaving">Sim, Excluir</button>
            <button class="btn-confirm-cancel" @click="confirmModal.show = false" :disabled="isSaving">Cancelar</button>
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
const selectedInva = ref(null)
const isSaving = ref(false)
const isEditing = ref(false)

const confirmModal = reactive({
  show: false,
  inva: null
})

const form = reactive({
  id: null,
  nome: '',
  celular: '',
  baseId: null,
  situacaoInvaId: null
})

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const filteredInvas = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return (store.INVAS.value || []).filter(i => 
    i.nome.toLowerCase().includes(query) || 
    (i.base?.nome || '').toLowerCase().includes(query) ||
    (i.celular || '').includes(query)
  )
})

const isValid = computed(() => {
  return form.nome.trim().length > 3 && form.celular.trim().length >= 8 && form.baseId && form.situacaoInvaId
})

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await Promise.all([
      store.fetchInvas(),
      store.fetchBases(),
      store.fetchSituacoes()
    ])
  } finally {
    store.state.globalLoading = false
  }
})

function createNew() {
  isEditing.value = false
  selectedInva.value = null
  form.id = null
  form.nome = ''
  form.celular = ''
  form.baseId = null
  form.situacaoInvaId = null
}

function selectInva(inva) {
  isEditing.value = true
  selectedInva.value = inva
  form.id = inva.id
  form.nome = inva.nome
  form.celular = inva.celular || ''
  form.baseId = inva.baseId || inva.base?.id
  form.situacaoInvaId = inva.situacaoInvaId || inva.situacaoInva?.id
}

function getSitLabel(nome) {
  if (!nome) return 'Sem Situação'
  const labels = {
    'clt_full': 'Clt Full-time',
    'clt_part': 'Clt Part-time',
    'solo': 'Solo',
    'eventual': 'Eventual',
    'checador': 'Checador'
  }
  return labels[nome.toLowerCase()] || nome
}

function getSitClass(nome) {
  if (!nome) return ''
  const n = nome.toLowerCase()
  if (n.includes('full')) return 'sit-full'
  if (n.includes('part')) return 'sit-part'
  if (n.includes('solo')) return 'sit-solo'
  if (n.includes('eventual')) return 'sit-eventual'
  if (n.includes('checador')) return 'sit-checador'
  return ''
}

function cancelEdit() {
  createNew()
}

async function handleSave() {
  if (!isValid.value) return
  isSaving.value = true
  
  const payload = {
    nome: form.nome.toUpperCase(),
    celular: form.celular,
    baseId: form.baseId,
    situacaoInvaId: form.situacaoInvaId
  }
  
  try {
    let res
    if (isEditing.value) {
      res = await store.updateInva(form.id, payload)
    } else {
      res = await store.saveInva(payload)
    }
    
    if (res.success) {
      showToast(isEditing.value ? 'Instrutor atualizado!' : 'Instrutor cadastrado!', 'success')
      createNew()
    } else {
      showToast(res.error || 'Erro ao salvar instrutor', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao salvar.', 'danger')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(inva) {
  confirmModal.inva = inva
  confirmModal.show = true
}

async function executeDelete() {
  const inva = confirmModal.inva
  if (!inva) return
  
  isSaving.value = true
  try {
    const res = await store.deleteInva(inva.id)
    if (res.success) {
      showToast('Instrutor excluído com sucesso!', 'success')
      if (selectedInva.value?.id === inva.id) createNew()
      confirmModal.show = false
    } else {
      showToast(res.error || 'Erro ao excluir instrutor', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao excluir.', 'danger')
  } finally {
    isSaving.value = false
  }
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

.module-grid { display: grid; grid-template-columns: 1fr 450px; gap: 24px; }

.list-card, .form-card { background: #fff; border-radius: 16px; border: 1px solid #dae2ec; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; }

.card-header { padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; font-size: 15px; color: var(--primary); font-weight: 800; }

.search-box { flex: 1; margin-right: 16px; }
.search-input { width: 100%; padding: 8px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 13px; outline: none; }
.search-input:focus { border-color: var(--secondary); }

.btn-add { background: var(--secondary); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }

.card-body { padding: 24px; }
.scrollable { max-height: 600px; overflow-y: auto; padding: 12px; }

.inva-item {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px;
  cursor: pointer; transition: all 0.2s;
}
.inva-item:hover { border-color: var(--primary); background: #f8fafc; transform: translateX(4px); }
.inva-item.active { border-color: var(--primary); background: var(--primary-light); }

.inva-name { font-size: 14px; font-weight: 700; color: var(--primary); display: block; }
.inva-details { margin-top: 2px; }
.inva-cell { font-size: 12px; color: #64748b; font-weight: 500; }
.inva-tags { display: flex; gap: 6px; margin-top: 6px; }
.tag-base, .tag-sit { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
.tag-base { background: #e0f2fe; color: #0369a1; }
.tag-sit { background: #f1f5f9; color: #475569; }

.tag-sit.sit-full { background: #dcfce7; color: #166534; }
.tag-sit.sit-part { background: #fef9c3; color: #854d0e; }
.tag-sit.sit-solo { background: #fee2e2; color: #991b1b; }
.tag-sit.sit-eventual { background: #f3e8ff; color: #6b21a8; }
.tag-sit.sit-checador { background: #ffedd5; color: #9a3412; }

.btn-delete-small { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; transition: opacity 0.2s; }
.btn-delete-small:hover { opacity: 1; }

.form-container { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }

.form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: var(--primary); }
.form-input, .form-select { width: 100%; padding: 10px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 14px; outline: none; }
.form-input:focus, .form-select:focus { border-color: var(--secondary); }

.form-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-save { flex: 2; padding: 12px; background: var(--secondary); color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel { flex: 1; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

.empty-list { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 12px 20px; border-radius: 12px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }

/* Modal de Confirmação */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 7000;
}
.confirm-modal {
  background: #fff; padding: 32px; border-radius: 20px; width: 100%; max-width: 400px;
  text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
}
.confirm-icon { font-size: 48px; margin-bottom: 16px; }
.confirm-modal h3 { margin: 0 0 12px; color: var(--primary); font-size: 18px; font-weight: 800; }
.confirm-modal p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 12px; }
.btn-confirm-delete { flex: 1; padding: 12px; background: #c0392b; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-confirm-delete:hover { background: #a93226; transform: translateY(-1px); }
.btn-confirm-cancel { flex: 1; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
.btn-confirm-cancel:hover { background: #e2e8f0; }

@media (max-width: 900px) {
  .module-grid { grid-template-columns: 1fr; }
}
</style>
