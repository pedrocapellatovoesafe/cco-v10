<template>
  <div class="screen-layout">
    <div class="config-module">
      <div class="module-header">
        <div class="title-area">
          <h1>📚 Gestão de Cursos e Missões</h1>
          <p>Cadastre os cursos e defina suas respectivas missões de treinamento</p>
        </div>
        <div class="header-actions">
          <button class="btn-back-nav" @click="router.push('/configuracoes')">← Voltar</button>
        </div>
      </div>

      <div class="module-grid">
        <!-- Listagem de Cursos -->
        <div class="list-card">
          <div class="card-header">
            <div class="search-box">
              <input type="text" v-model="searchQuery" placeholder="🔍 Buscar curso..." class="search-input" />
            </div>
            <button class="btn-add" @click="createNewCurso">➕ Novo Curso</button>
          </div>
          
          <div class="card-body scrollable">
            <div v-if="filteredCursos.length === 0" class="empty-list">
              Nenhum curso encontrado.
            </div>
            <div v-for="curso in filteredCursos" :key="curso.id" 
                 :class="['curso-item', selectedCurso?.id === curso.id ? 'active' : '']"
                 @click="selectCurso(curso)">
              <div class="curso-info">
                <span class="curso-name">{{ curso.nome }}</span>
                <div class="curso-tags">
                  <span class="tag-count">{{ curso.missoes?.length || 0 }} Missões</span>
                </div>
              </div>
              <div class="curso-actions">
                <button class="btn-delete-small" @click.stop="handleDeleteCurso(curso)" title="Excluir Curso">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Edição de Curso e Missões -->
        <div class="form-card">
          <div class="card-header">
            <h3>{{ isEditing ? '✏️ Editar Curso' : '✨ Novo Curso' }}</h3>
          </div>
          <div class="card-body scrollable-form">
            <div class="form-container">
              <!-- Dados do Curso -->
              <div class="form-section">
                <div class="form-group">
                  <label>Nome do Curso:</label>
                  <input type="text" v-model="cursoForm.nome" placeholder="Ex: PPA - Prático" class="form-input" />
                </div>

                <div class="form-actions-main">
                  <button class="btn-save-main" @click="handleSaveCurso" :disabled="isSaving || !isValidCurso">
                    {{ isSaving ? 'Processando...' : (isEditing ? 'Atualizar Curso' : 'Criar Curso') }}
                  </button>
                  <button v-if="isEditing" class="btn-cancel-main" @click="createNewCurso">Cancelar</button>
                </div>
              </div>

              <!-- Gestão de Missões (Apenas se já existir o curso) -->
              <div v-if="isEditing" class="missoes-section">
                <div class="section-header">
                  <h4>🎯 Missões deste Curso</h4>
                  <button class="btn-add-missao" @click="showAddMissao = true">➕ Add Missão</button>
                </div>

                <!-- Input rápido para adicionar missão -->
                <div v-if="showAddMissao" class="add-missao-box">
                  <input type="text" v-model="newMissaoNome" placeholder="Nome da missão" class="form-input" @keyup.enter="handleAddMissao" />
                  <div class="add-missao-actions">
                    <button class="btn-confirm-missao" @click="handleAddMissao" :disabled="!newMissaoNome">Salvar</button>
                    <button class="btn-cancel-missao" @click="showAddMissao = false">Cancelar</button>
                  </div>
                </div>

                <div class="missoes-list">
                  <div v-if="!selectedCurso.missoes || selectedCurso.missoes.length === 0" class="empty-missoes">
                    Nenhuma missão cadastrada para este curso.
                  </div>
                  <div v-for="m in sortedMissoes" :key="m.id" class="missao-row">
                    <input type="text" v-model="m.nome" class="missao-input-inline" @change="handleUpdateMissao(m)" />
                    <button class="btn-del-missao" @click="handleDeleteMissao(m)" title="Remover Missão">🗑️</button>
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
const selectedCurso = ref(null)
const isSaving = ref(false)
const isEditing = ref(false)
const showAddMissao = ref(false)
const newMissaoNome = ref('')

const cursoForm = reactive({
  id: null,
  nome: ''
})

const confirmModal = reactive({ show: false, title: '', message: '', onConfirm: null })

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const filteredCursos = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return store.CURSOS.value || []
  
  return (store.CURSOS.value || []).filter(c => {
    const courseMatches = c.nome.toLowerCase().includes(query)
    const missionMatches = c.missoes && c.missoes.some(m => m.nome.toLowerCase().includes(query))
    return courseMatches || missionMatches
  })
})

const sortedMissoes = computed(() => {
  if (!selectedCurso.value?.missoes) return []
  return [...selectedCurso.value.missoes].sort((a, b) => a.nome.localeCompare(b.nome))
})

const isValidCurso = computed(() => cursoForm.nome.length > 2)

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await store.fetchCursos()
  } finally {
    store.state.globalLoading = false
  }
})

function createNewCurso() {
  isEditing.value = false
  selectedCurso.value = null
  cursoForm.id = null
  cursoForm.nome = ''
  showAddMissao.value = false
  newMissaoNome.value = ''
}

function selectCurso(curso) {
  isEditing.value = true
  selectedCurso.value = curso
  cursoForm.id = curso.id
  cursoForm.nome = curso.nome
  showAddMissao.value = false
  newMissaoNome.value = ''
}

async function handleSaveCurso() {
  if (!isValidCurso.value) return
  isSaving.value = true
  const payload = { nome: cursoForm.nome }
  
  try {
    const res = isEditing.value 
      ? await store.updateCurso(cursoForm.id, payload) 
      : await store.saveCurso(payload)
      
    if (res.success) {
      showToast(isEditing.value ? 'Curso atualizado!' : 'Curso criado!', 'success')
      if (!isEditing.value) selectCurso(res.data)
      else await store.fetchCursos()
    } else {
      showToast(res.error || 'Erro ao salvar curso', 'danger')
    }
  } finally {
    isSaving.value = false
  }
}

function handleDeleteCurso(curso) {
  confirmModal.title = 'Excluir Curso'
  confirmModal.message = `Deseja realmente excluir o curso "${curso.nome}"? Isso removerá todas as suas missões vinculadas.`
  confirmModal.onConfirm = async () => {
    confirmModal.show = false
    const res = await store.deleteCurso(curso.id)
    if (res.success) {
      showToast('Curso excluído!')
      if (selectedCurso.value?.id === curso.id) createNewCurso()
    } else {
      showToast(res.error || 'Erro ao excluir curso', 'danger')
    }
  }
  confirmModal.show = true
}

async function handleAddMissao() {
  if (!newMissaoNome.value) return
  const res = await store.saveMissao({ cursoId: selectedCurso.value.id, nome: newMissaoNome.value })
  if (res.success) {
    showToast('Missão adicionada!')
    newMissaoNome.value = ''
    showAddMissao.value = false
    refreshSelectedCurso()
  } else {
    showToast(res.error || 'Erro ao adicionar missão', 'danger')
  }
}

async function handleUpdateMissao(m) {
  const res = await store.updateMissao(m.id, { nome: m.nome, cursoId: selectedCurso.value.id })
  if (res.success) {
    showToast('Missão atualizada')
  } else {
    showToast(res.error || 'Erro ao atualizar missão', 'danger')
  }
}

function handleDeleteMissao(m) {
  confirmModal.title = 'Excluir Missão'
  confirmModal.message = `Deseja realmente excluir a missão "${m.nome}"? Esta ação não pode ser desfeita.`
  confirmModal.onConfirm = async () => {
    confirmModal.show = false
    const res = await store.deleteMissao(m.id)
    if (res.success) {
      showToast('Missão removida')
      refreshSelectedCurso()
    } else {
      showToast(res.error || 'Erro ao remover missão', 'danger')
    }
  }
  confirmModal.show = true
}

function refreshSelectedCurso() {
  const updated = store.CURSOS.value.find(c => c.id === selectedCurso.value.id)
  if (updated) selectedCurso.value = updated
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

.curso-item {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px;
  cursor: pointer; transition: all 0.2s;
}
.curso-item:hover { border-color: var(--primary); transform: translateX(4px); }
.curso-item.active { border-color: var(--primary); background: #f0f7ff; }

.curso-name { font-size: 14px; font-weight: 700; color: var(--primary); }
.curso-tags { display: flex; gap: 6px; margin-top: 6px; }
.tag-count { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; color: #475569; text-transform: uppercase; }

.btn-delete-small { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.4; }
.btn-delete-small:hover { opacity: 1; }

.form-container { display: flex; flex-direction: column; gap: 24px; padding: 4px; }
.form-section { padding-bottom: 20px; border-bottom: 2px dashed #f1f5f9; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: var(--primary); }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 14px; outline: none; }

.form-actions-main { display: flex; gap: 10px; margin-top: 10px; }
.btn-save-main { flex: 1; padding: 12px; background: var(--secondary); color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-cancel-main { padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* Missões */
.missoes-section { display: flex; flex-direction: column; gap: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-header h4 { margin: 0; font-size: 14px; color: var(--primary); }
.btn-add-missao { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }

.add-missao-box { background: #f8fafc; padding: 12px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #e2e8f0; }
.add-missao-actions { display: flex; gap: 8px; }
.btn-confirm-missao { background: var(--secondary); color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; flex: 1; }
.btn-cancel-missao { background: #fff; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; }

.missoes-list { display: flex; flex-direction: column; gap: 8px; }
.missao-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; }
.missao-input-inline { flex: 1; border: none; font-size: 13px; color: var(--primary); background: transparent; font-weight: 500; }
.missao-input-inline:focus { background: #f8fafc; outline: none; }

.btn-del-missao { background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.3; }
.btn-del-missao:hover { opacity: 1; color: #c0392b; }

.empty-list, .empty-missoes { text-align: center; padding: 20px; color: #94a3b8; font-style: italic; font-size: 13px; }

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
