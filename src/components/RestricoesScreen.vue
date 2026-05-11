<template>
  <div class="screen-layout">
    <div id="rest-screen" class="restricoes-screen">
      <div class="rest-header">
        <div class="rest-title-area">
          <h1>🛠️ Gestão de Restrições Operacionais</h1>
          <p>Configure alertas e impedimentos cruzados para a escala</p>
        </div>
        <div class="header-actions">
          <button class="btn-rest-back" @click="handleBackToEditor">← Voltar ao Editor</button>
          <button class="btn-logout-rest" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="rest-grid">
        <!-- Formulário de Nova/Editar Restrição -->
        <div class="rest-card form-card">
          <div class="card-header">
            <h3>{{ isEditing ? '✏️ Editar Restrição' : '🆕 Nova Restrição' }}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Título da Restrição:</label>
              <input type="text" v-model="form.nome" placeholder="Ex: Instrutor s/ Habilitação p/ Missão" class="form-input" />
            </div>

            <div class="form-group">
              <label>Tipo de Cruzamento:</label>
              <select v-model="selectedType" class="form-select" :disabled="isEditing">
                <option value="">Selecione o tipo...</option>
                <option value="aluno_inva">Aluno x Instrutor (Interpessoal)</option>
                <option value="ae_missao">Aeronave x Missão</option>
                <option value="inva_missao">Instrutor x Missão</option>
                <option value="mod_missao">Modelo de Aeronave x Missão</option>
                <option value="inva_only">Restrição de Instrutor (Geral)</option>
                <option value="aluno_only">Restrição de Aluno (Geral)</option>
              </select>
            </div>

            <!-- Campos Dinâmicos -->
            <transition name="fade">
              <div class="dynamic-fields" v-if="selectedType">
                
                <div class="form-group" v-if="['aluno_inva', 'aluno_only'].includes(selectedType)">
                  <label>Aluno:</label>
                  <select v-model="form.alunoId" class="form-select">
                    <option :value="null">Selecione o aluno...</option>
                    <option v-for="a in store.state.ALUNOS" :key="a.id" :value="a.id">{{ a.nome }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="['aluno_inva', 'inva_missao', 'inva_only'].includes(selectedType)">
                  <label>Instrutor (INVA):</label>
                  <select v-model="form.invaId" class="form-select">
                    <option :value="null">Selecione o instrutor...</option>
                    <option v-for="i in store.state.INVAS" :key="i.id" :value="i.id">{{ i.nome }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="['ae_missao'].includes(selectedType)">
                  <label>Aeronave:</label>
                  <select v-model="form.aeronaveId" class="form-select">
                    <option :value="null">Selecione a aeronave...</option>
                    <option v-for="ae in store.state.AERONAVES" :key="ae.id" :value="ae.id">{{ ae.nome }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="['mod_missao'].includes(selectedType)">
                  <label>Modelo de Aeronave:</label>
                  <select v-model="form.modeloAeronaveId" class="form-select">
                    <option :value="null">Selecione o modelo...</option>
                    <option v-for="m in store.state.MODELOS" :key="m.id" :value="m.id">{{ m.nome }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="['ae_missao', 'inva_missao', 'mod_missao'].includes(selectedType)">
                  <label>Missão:</label>
                  <select v-model="form.missaoId" class="form-select">
                    <option :value="null">Selecione a missão...</option>
                    <option v-for="ms in store.state.MISSOES" :key="ms.id" :value="ms.id">{{ ms.nome }}</option>
                  </select>
                </div>

              </div>
            </transition>

            <div class="form-group">
              <label>Observação (Mensagem do Alerta):</label>
              <textarea v-model="form.observacao" placeholder="Descreva o motivo da restrição..." class="form-textarea"></textarea>
            </div>

            <div class="form-actions">
              <button class="btn-save" @click="handleSave" :disabled="isSaving || !selectedType || !form.nome">
                {{ isSaving ? 'Processando...' : (isEditing ? 'Atualizar Restrição' : 'Criar Regra de Restrição') }}
              </button>
              <button v-if="isEditing" class="btn-cancel-edit" @click="resetForm" :disabled="isSaving">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- Listagem de Restrições -->
        <div class="rest-card list-card">
          <div class="card-header">
            <h3>📋 Regras Ativas</h3>
          </div>
          <div class="card-body scrollable">
            <div v-if="store.state.RESTRICTS.length === 0" class="empty-list">
              Nenhuma restrição cadastrada.
            </div>
            <div v-for="r in store.state.RESTRICTS" :key="r.id" class="restrict-item">
              <div class="restrict-info">
                <h4>{{ r.nome }}</h4>
                <p class="restrict-obs">{{ r.observacao }}</p>
                <div class="restrict-tags">
                  <span v-if="r.isAlunoInva" class="tag tag-blue">Aluno x INVA</span>
                  <span v-else-if="r.isAeronave && r.isMissao" class="tag tag-orange">AE x Missão</span>
                  <span v-else-if="r.isInva && r.isMissao" class="tag tag-purple">INVA x Missão</span>
                  <span v-else-if="r.isModelo && r.isMissao" class="tag tag-teal">Modelo x Missão</span>
                  <span v-else-if="r.isInva" class="tag tag-gray">INVA</span>
                  <span v-else-if="r.isAluno" class="tag tag-gray">Aluno</span>
                  <span v-else class="tag tag-gray">Geral</span>
                </div>
              </div>
              <div class="item-actions">
                <button class="btn-edit" @click="handleEdit(r)" title="Editar">✏️</button>
                <button class="btn-delete" @click="handleDelete(r.id)" title="Excluir">🗑️</button>
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

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const selectedType = ref('')
const isSaving = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const form = reactive({
  nome: '',
  observacao: '',
  invaId: null,
  alunoId: null,
  aeronaveId: null,
  modeloAeronaveId: null,
  missaoId: null,
})

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

function resetForm() {
  form.nome = ''; form.observacao = ''; form.invaId = null; form.alunoId = null;
  form.aeronaveId = null; form.modeloAeronaveId = null; form.missaoId = null;
  selectedType.value = ''
  isEditing.value = false
  editingId.value = null
}

function handleEdit(r) {
  isEditing.value = true
  editingId.value = r.id
  form.nome = r.nome || ''
  form.observacao = r.observacao || ''
  form.invaId = r.inva_id || r.invaId || null
  form.alunoId = r.aluno_id || r.alunoId || null
  form.aeronaveId = r.aeronave_id || r.aeronaveId || null
  form.modeloAeronaveId = r.modelo_aeronave_id || r.modeloAeronaveId || null
  form.missaoId = r.missao_id || r.missaoId || null

  // Infer selectedType from flags (Strict Matching)
  if (r.is_aluno_inva || r.isAlunoInva) selectedType.value = 'aluno_inva'
  else if ((r.is_aeronave || r.isAeronave) && (r.is_missao || r.isMissao)) selectedType.value = 'ae_missao'
  else if ((r.is_inva || r.isInva) && (r.is_missao || r.isMissao)) selectedType.value = 'inva_missao'
  else if ((r.is_modelo || r.isModelo) && (r.is_missao || r.isMissao)) selectedType.value = 'mod_missao'
  else if (r.is_inva || r.isInva) selectedType.value = 'inva_only'
  else if (r.is_aluno || r.isAluno) selectedType.value = 'aluno_only'
  else selectedType.value = ''
  
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSave() {
  isSaving.value = true
  
  const payload = {
    nome: form.nome,
    observacao: form.observacao,
    isInva: false,
    isAluno: false,
    isAlunoInva: false,
    isModelo: false,
    isAeronave: false,
    isMissao: false
  }

  if (selectedType.value === 'aluno_inva') {
    payload.alunoId = form.alunoId; payload.invaId = form.invaId;
    payload.isAluno = false; payload.isInva = false; payload.isAlunoInva = true;
  } else if (selectedType.value === 'ae_missao') {
    payload.aeronaveId = form.aeronaveId; payload.missaoId = form.missaoId;
    payload.isAeronave = true; payload.isMissao = true;
  } else if (selectedType.value === 'inva_missao') {
    payload.invaId = form.invaId; payload.missaoId = form.missaoId;
    payload.isInva = true; payload.isMissao = true;
  } else if (selectedType.value === 'mod_missao') {
    payload.modeloAeronaveId = form.modeloAeronaveId; payload.missaoId = form.missaoId;
    payload.isModelo = true; payload.isMissao = true;
  } else if (selectedType.value === 'inva_only') {
    payload.invaId = form.invaId; payload.isInva = true;
  } else if (selectedType.value === 'aluno_only') {
    payload.alunoId = form.alunoId; payload.isAluno = true;
  }

  try {
    let res
    if (isEditing.value) res = await store.updateRestriction(editingId.value, payload)
    else res = await store.saveRestriction(payload)

    if (res.success) {
      showToast(isEditing.value ? 'Restrição atualizada!' : 'Restrição criada!', 'success')
      resetForm()
    } else {
      showToast(res.error || 'Erro ao processar restrição', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao salvar.', 'danger')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id) {
  if (!confirm('Deseja excluir esta regra de restrição?')) return
  const res = await store.deleteRestriction(id)
  if (res.success) showToast('Restrição removida.', 'success')
  else showToast('Erro ao remover.', 'danger')
}

function handleBackToEditor() { router.push('/editor') }
function handleLogout() { store.logout(); router.push('/login') }
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  padding: 24px;
  background: #f0f4f8;
}
.restricoes-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.rest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  background: #1d2951;
  color: #fff;
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.rest-title-area h1 { font-size: 20px; font-weight: 800; margin: 0; }
.rest-title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }

.header-actions { display: flex; gap: 12px; }
.btn-rest-back, .btn-logout-rest {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-rest-back:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.btn-logout-rest { background: #c0392b; border: none; }
.btn-logout-rest:hover { background: #a93226; transform: translateY(-1px); }

.rest-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  align-items: start;
}
.rest-card {
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.card-header {
  padding: 16px 22px;
  background: #f8fafc;
  border-bottom: 1px solid #dae2ec;
}
.card-header h3 { margin: 0; font-size: 15px; color: #1d2951; font-weight: 800; }
.card-body { padding: 22px; }
.card-body.scrollable { max-height: calc(100vh - 250px); overflow-y: auto; }

.form-group { margin-bottom: 18px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #5a6370; text-transform: uppercase; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #d8dee8; border-radius: 8px;
  font-size: 13px; color: #1d2951; outline: none; transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.form-textarea { height: 80px; resize: none; }

.form-actions { display: flex; flex-direction: column; gap: 10px; }
.btn-save {
  width: 100%; padding: 14px; background: #1d2951; color: #fff; border: none;
  border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.btn-save:hover:not(:disabled) { background: #2a3b59; transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-cancel-edit {
  width: 100%; padding: 10px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;
  border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.btn-cancel-edit:hover { background: #e2e8f0; }

.restrict-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid #f1f5f9;
}
.restrict-item:last-child { border-bottom: none; }
.restrict-info { flex: 1; margin-right: 15px; }
.restrict-info h4 { margin: 0 0 6px; font-size: 14px; color: #1d2951; font-weight: 700; }
.restrict-obs { margin: 0 0 10px; font-size: 12px; color: #64748b; line-height: 1.4; }
.restrict-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; }
.tag-blue { background: #eff6ff; color: #3b82f6; }
.tag-orange { background: #fff7ed; color: #f97316; }
.tag-purple { background: #faf5ff; color: #a855f7; }
.tag-teal { background: #f0fdfa; color: #14b8a6; }
.tag-gray { background: #f1f5f9; color: #64748b; }

.item-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-edit, .btn-delete { background: none; border: none; font-size: 16px; cursor: pointer; opacity: 0.6; transition: all 0.2s; }
.btn-edit:hover, .btn-delete:hover { opacity: 1; transform: scale(1.15); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Toast */
.toast-notification {
  position: fixed; top: 24px; right: 24px; padding: 14px 22px; border-radius: 12px;
  z-index: 6000; display: flex; gap: 12px; align-items: center; box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }
</style>
