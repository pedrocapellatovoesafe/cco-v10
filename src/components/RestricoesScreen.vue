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
        <div class="form-column">
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

          <!-- Presets de Restrição -->
          <div class="rest-card preset-card">
            <div class="card-header">
              <h3>🚀 Presets (Modelos Rápidos)</h3>
            </div>
            <div class="card-body">
              <!-- Preset Instrutor -->
              <div class="preset-section">
                <div class="form-group">
                  <label>Instrutor p/ Preset:</label>
                  <select v-model="presetInvaId" class="form-select">
                    <option :value="null">Selecione o instrutor...</option>
                    <option v-for="i in store.state.INVAS" :key="i.id" :value="i.id">{{ i.nome }}</option>
                  </select>
                </div>
                <button class="btn-apply-preset" @click="handleApplyInvaPreset" :disabled="!presetInvaId">
                  Aplicar Preset: Instrutor Eventual
                </button>
              </div>

              <div class="preset-divider"></div>

              <!-- Preset Aeronave -->
              <div class="preset-section">
                <div class="form-group">
                  <label>Aeronave p/ Preset:</label>
                  <select v-model="presetAeronaveId" class="form-select">
                    <option :value="null">Selecione a aeronave...</option>
                    <option v-for="ae in store.state.AERONAVES" :key="ae.id" :value="ae.id">{{ ae.nome }}</option>
                  </select>
                </div>
                <div class="preset-actions-grid">
                  <button class="btn-apply-preset secondary" @click="handleApplyAircraftPreset('diurna')" :disabled="!presetAeronaveId">
                    Somente Diurna
                  </button>
                  <button class="btn-apply-preset secondary" @click="handleApplyAircraftPreset('vfr')" :disabled="!presetAeronaveId">
                    VFR Only (Não IFR)
                  </button>
                </div>
              </div>
              
              <p class="preset-help">Gera restrições em lote para todas as missões exceto as autorizadas ou baseadas em regras de segurança.</p>
            </div>
          </div>
        </div>

        <!-- Listagem de Restrições -->
        <div class="rest-card list-card">
          <div class="card-header">
            <h3>📋 Regras Ativas</h3>
          </div>
          
          <!-- Filtros de Busca -->
          <div class="list-filters">
            <div class="filter-row">
              <select v-model="filters.type" class="filter-select mini">
                <option value="">Todos os Tipos</option>
                <option value="aluno_inva">Aluno x INVA</option>
                <option value="ae_missao">AE x Missão</option>
                <option value="inva_missao">INVA x Missão</option>
                <option value="mod_missao">Modelo x Missão</option>
                <option value="inva_only">INVA</option>
                <option value="aluno_only">Aluno</option>
              </select>
              
              <select v-model="filters.alunoId" class="filter-select">
                <option :value="null">Todos os Alunos</option>
                <option v-for="a in store.state.ALUNOS" :key="a.id" :value="a.id">{{ a.nome }}</option>
              </select>

              <select v-model="filters.invaId" class="filter-select">
                <option :value="null">Todos os INVAs</option>
                <option v-for="i in store.state.INVAS" :key="i.id" :value="i.id">{{ i.nome }}</option>
              </select>
              
              <button class="btn-clear-filters" @click="clearFilters" title="Limpar Filtros">✕</button>
            </div>
          </div>

          <div class="card-body scrollable">
            <!-- Review de Batch se existir -->
            <div v-if="batchList.length > 0" class="batch-review-area">
              <div class="batch-header">
                <h4>⚠️ Revisão de Lote ({{ batchList.length }} itens)</h4>
                <p>Remova os itens que NÃO deseja restringir antes de salvar.</p>
              </div>
              <div class="batch-items">
                <div v-for="(b, idx) in batchList" :key="idx" class="batch-item">
                  <span class="batch-text">{{ b.nome }}</span>
                  <button class="btn-remove-batch" @click="removeFromBatch(idx)">✕</button>
                </div>
              </div>
              <div class="batch-footer">
                <button class="btn-save-batch" @click="saveBatch" :disabled="isSavingBatch">
                  {{ isSavingBatch ? 'Processando Lote...' : 'Confirmar e Salvar Tudo' }}
                </button>
                <button class="btn-cancel-batch" @click="batchList = []">Cancelar Lote</button>
              </div>
            </div>

            <div v-if="filteredRestricts.length === 0 && batchList.length === 0" class="empty-list">
              Nenhuma restrição encontrada para os filtros selecionados.
            </div>
            <div v-for="r in filteredRestricts" :key="r.id" class="restrict-item">
              <div class="restrict-info">
                <h4>{{ r.nome }}</h4>
                <p class="restrict-obs">{{ r.observacao }}</p>
                <div class="restrict-tags">
                  <span v-if="r.is_aluno_inva || r.isAlunoInva" class="tag tag-blue">Aluno x INVA</span>
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
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EVENTUAL_INSTRUCTOR_ALLOWLIST, AIRCRAFT_PRESET_CODES } from '../constants/presets'

const router = useRouter()
const store = inject('store')

const selectedType = ref('')
const isSaving = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

// Batch Presets State
const presetInvaId = ref(null)
const presetAeronaveId = ref(null)
const batchList = ref([])
const isSavingBatch = ref(false)
const showConfirmModal = ref(false)

const filters = reactive({
  type: '',
  alunoId: null,
  invaId: null
})

const form = reactive({
  nome: '',
  observacao: '',
  invaId: null,
  alunoId: null,
  aeronaveId: null,
  modeloAeronaveId: null,
  missaoId: null,
})

const filteredRestricts = computed(() => {
  return store.state.RESTRICTS.filter(r => {
    // Filter by Type
    if (filters.type) {
      if (filters.type === 'aluno_inva' && !(r.isAlunoInva || r.is_aluno_inva)) return false
      if (filters.type === 'ae_missao' && !(r.isAeronave && r.isMissao)) return false
      if (filters.type === 'inva_missao' && !(r.isInva && r.isMissao)) return false
      if (filters.type === 'mod_missao' && !(r.isModelo && r.isMissao)) return false
      if (filters.type === 'inva_only' && !(r.isInva && !r.isMissao && !r.isAlunoInva)) return false
      if (filters.type === 'aluno_only' && !(r.isAluno && !r.isAlunoInva)) return false
    }
    
    // Filter by Aluno
    if (filters.alunoId) {
      const rid = r.alunoId || r.aluno_id
      if (rid != filters.alunoId) return false
    }

    // Filter by INVA
    if (filters.invaId) {
      const rid = r.invaId || r.inva_id
      if (rid != filters.invaId) return false
    }

    return true
  })
})

function clearFilters() {
  filters.type = ''
  filters.alunoId = null
  filters.invaId = null
}

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

/**
 * Preset Logic: Instrutor Eventual
 * Filters all missions and identifies which ones should be restricted (not in allowlist).
 */
function applyEventualInstructorPreset(invaId, allMissions) {
  const inva = store.state.INVAS.find(i => i.id === invaId)
  const invaNome = inva ? inva.nome : 'Instrutor'
  const generated = []

  allMissions.forEach(mission => {
    let isAuthorized = false
    const missionName = (mission.nome || '').toUpperCase()
    const courseName = (mission.curso?.nome || '').toUpperCase()

    // 1. PPA Logic
    if (EVENTUAL_INSTRUCTOR_ALLOWLIST.PPA.keywords.some(k => courseName.includes(k))) {
      isAuthorized = EVENTUAL_INSTRUCTOR_ALLOWLIST.PPA.authorizedMissions.some(code => missionName.includes(code))
    }
    // 2. PCA Logic
    else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.keywords.some(k => courseName.includes(k))) {
      const isAllowed = EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.authorizedMissions.some(code => missionName.includes(code))
      const isExcluded = EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.excludedMissions?.some(code => missionName.includes(code))
      isAuthorized = isAllowed && !isExcluded
    }
    // 3. INVA/CFI Logic
    else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.INVA_CFI.keywords.some(k => courseName.includes(k))) {
      isAuthorized = false
    }
    // 4. Aperfeiçoamento Contínuo Logic
    else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.APERFEICOAMENTO.keywords.some(k => courseName.includes(k))) {
      const isEval = EVENTUAL_INSTRUCTOR_ALLOWLIST.APERFEICOAMENTO.evaluationKeywords.some(k => missionName.includes(k))
      isAuthorized = !isEval
    }
    // 5. Voos Administrativos Logic
    else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.ADMIN.keywords.some(k => courseName.includes(k))) {
      isAuthorized = EVENTUAL_INSTRUCTOR_ALLOWLIST.ADMIN.authorizedMissions.some(code => missionName.includes(code))
    }

    if (!isAuthorized) {
      generated.push({
        nome: `[Preset] ${invaNome} - Restrição ${mission.nome}`,
        observacao: `Restrição automática (Preset Instrutor Eventual): Não autorizado para missão ${mission.nome}`,
        invaId: invaId,
        missaoId: mission.id,
        isInva: true,
        isMissao: true
      })
    }
  })
  return generated
}

/**
 * Aircraft Preset Logic
 * Generates restrictions based on mission codes (e.g., NOT01, IFR05)
 */
function generateAircraftPreset(type, aircraftId) {
  const ae = store.state.AERONAVES.find(a => a.id === aircraftId)
  const aeNome = ae ? ae.nome : 'Aeronave'
  const generated = []
  
  // Define which codes to look for based on preset type
  const restrictedCodes = type === 'diurna' 
    ? AIRCRAFT_PRESET_CODES.DIURNA_ONLY_RESTRICTED 
    : AIRCRAFT_PRESET_CODES.VFR_ONLY_RESTRICTED

  const typeLabel = type === 'diurna' ? 'Somente Diurna' : 'VFR Only'

  store.state.MISSOES.forEach(mission => {
    const missionName = (mission.nome || '').toUpperCase()
    
    // Check if mission name/code contains any of the restricted codes
    const isRestricted = restrictedCodes.some(code => missionName.includes(code))

    if (isRestricted) {
      // Avoid duplicates if already in batchList
      const exists = batchList.value.some(b => b.aeronaveId === aircraftId && b.missaoId === mission.id)
      if (!exists) {
        generated.push({
          nome: `[Preset AE] ${aeNome} - ${typeLabel} (${mission.nome})`,
          observacao: `Restrição automática (${typeLabel}): Aeronave não homologada/equipada para esta missão.`,
          aeronaveId: aircraftId,
          missaoId: mission.id,
          isAeronave: true,
          isMissao: true
        })
      }
    }
  })
  return generated
}

function handleApplyInvaPreset() {
  if (!presetInvaId.value) return
  const res = applyEventualInstructorPreset(presetInvaId.value, store.state.MISSOES)
  // Merge with existing batch, preventing duplicates
  const newItems = res.filter(newItem => 
    !batchList.value.some(oldItem => oldItem.invaId === newItem.invaId && oldItem.missaoId === newItem.missaoId)
  )
  batchList.value = [...batchList.value, ...newItems]
  showToast(`${newItems.length} restrições de instrutor adicionadas ao lote.`, 'success')
}

function handleApplyAircraftPreset(type) {
  if (!presetAeronaveId.value) return
  const res = generateAircraftPreset(type, presetAeronaveId.value)
  if (res.length === 0) {
    showToast('Nenhuma missão nova encontrada para este preset.', 'info')
    return
  }
  batchList.value = [...batchList.value, ...res]
  showToast(`${res.length} restrições de aeronave adicionadas ao lote.`, 'success')
}

function removeFromBatch(idx) {
  batchList.value.splice(idx, 1)
}

async function saveBatch() {
  if (batchList.value.length === 0) return
  showConfirmModal.value = true
}

async function confirmSaveBatch() {
  showConfirmModal.value = false
  isSavingBatch.value = true
  
  try {
    const res = await store.importRestrictions(batchList.value)
    if (res.success) {
      showToast(`Processamento concluído: ${batchList.value.length} restrições importadas com sucesso!`, 'success')
      batchList.value = []
      presetInvaId.value = null
    } else {
      showToast(res.error || 'Erro ao importar restrições em lote', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao processar lote.', 'danger')
  } finally {
    isSavingBatch.value = false
  }
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
.list-card {
  display: flex;
  flex-direction: column;
}
.list-filters {
  padding: 12px 22px;
  background: #f1f5f9;
  border-bottom: 1px solid #dae2ec;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  font-size: 12px;
  color: #1d2951;
  background: #fff;
  outline: none;
}
.filter-select.mini {
  flex: 0 0 130px;
}
.btn-clear-filters {
  background: #e2e8f0;
  color: #64748b;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}
.btn-clear-filters:hover { background: #cbd5e1; color: #1d2951; }

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

/* Preset Card */
.preset-card { margin-top: 24px; border-left: 6px solid #3b82f6; }
.preset-section { margin-bottom: 20px; }
.preset-section:last-child { margin-bottom: 0; }
.preset-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 20px 0;
  position: relative;
}
.preset-divider::after {
  content: 'OU';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 0 10px;
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
}

.preset-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-apply-preset {
  width: 100%; padding: 12px; background: #3b82f6; color: #fff; border: none;
  border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.btn-apply-preset.secondary {
  background: #f1f5f9;
  color: #1d2951;
  border: 1px solid #cbd5e1;
}
.btn-apply-preset:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
.btn-apply-preset.secondary:hover:not(:disabled) { background: #e2e8f0; border-color: #94a3b8; }
.btn-apply-preset:disabled { opacity: 0.5; cursor: not-allowed; }
.preset-help { margin: 12px 0 0; font-size: 11px; color: #64748b; line-height: 1.4; font-style: italic; }

/* Batch Review Area */
.batch-review-area {
  background: #fffbeb;
  border: 2px dashed #f59e0b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}
.batch-header h4 { margin: 0 0 4px; color: #92400e; font-size: 14px; font-weight: 800; }
.batch-header p { margin: 0 0 12px; color: #b45309; font-size: 12px; }

.batch-items {
  max-height: 200px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.batch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 11px;
}
.batch-text { color: #1d2951; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.btn-remove-batch {
  background: none; border: none; color: #ef4444; cursor: pointer; font-size: 12px; padding: 0 4px;
}

.batch-footer { display: flex; gap: 10px; }
.btn-save-batch {
  flex: 2; padding: 10px; background: #059669; color: #fff; border: none;
  border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;
}
.btn-cancel-batch {
  flex: 1; padding: 10px; background: #e2e8f0; color: #475569; border: none;
  border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;
}

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

/* Toast */
.toast-notification {
  position: fixed; top: 24px; right: 24px; padding: 14px 22px; border-radius: 12px;
  z-index: 6000; display: flex; gap: 12px; align-items: center; box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }
</style>
