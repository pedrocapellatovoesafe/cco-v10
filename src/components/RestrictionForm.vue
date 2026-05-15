<template>
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
            <option value="inva_modelo">Instrutor x Modelo de Aeronave</option>
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

            <div class="form-group" v-if="['aluno_inva', 'inva_missao', 'inva_modelo', 'inva_only'].includes(selectedType)">
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

            <div class="form-group" v-if="['mod_missao', 'inva_modelo'].includes(selectedType)">
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
            <label>Instrutores p/ Preset (Selecione vários):</label>
            <select v-model="presetInvaIds" class="form-select multi-select" multiple>
              <option v-for="i in store.state.INVAS" :key="i.id" :value="i.id">{{ i.nome }}</option>
            </select>
            <p class="select-hint">Segure Ctrl (ou Cmd) para selecionar múltiplos, ou clique e arraste.</p>
          </div>
          <div class="preset-actions-grid">
            <button class="btn-apply-preset" @click="handleApplyInvaPreset" :disabled="presetInvaIds.length === 0">
              Instrutor Eventual
            </button>
            <button class="btn-apply-preset" @click="handleApplyGroundPreset" :disabled="presetInvaIds.length === 0">
              Instrutor de Solo
            </button>
            <button class="btn-apply-preset" @click="handleApplyAnacPreset" :disabled="presetInvaIds.length === 0">
              Checador ANAC
            </button>
            <button class="btn-apply-preset" @click="handleApplyStandardPreset" :disabled="presetInvaIds.length === 0">
              Padrão p/ Todos
            </button>
          </div>
        </div>

        <div class="preset-divider"></div>

        <!-- Preset Aeronave -->
        <div class="preset-section">
          <div class="form-group">
            <label>Aeronaves p/ Preset (Selecione várias):</label>
            <select v-model="presetAeronaveIds" class="form-select multi-select" multiple>
              <option v-for="ae in store.state.AERONAVES" :key="ae.id" :value="ae.id">{{ ae.nome }}</option>
            </select>
            <p class="select-hint">Segure Ctrl (ou Cmd) para selecionar múltiplas, ou clique e arraste.</p>
          </div>
          <div class="preset-actions-grid">
            <button class="btn-apply-preset secondary" @click="handleApplyAircraftPreset('diurna')" :disabled="presetAeronaveIds.length === 0">
              Somente Diurna
            </button>
            <button class="btn-apply-preset secondary" @click="handleApplyAircraftPreset('vfr')" :disabled="presetAeronaveIds.length === 0">
              VFR Only (Não IFR)
            </button>
          </div>
        </div>
        
        <p class="preset-help">Gera restrições em lote para todas as missões exceto as autorizadas ou baseadas em regras de segurança.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, watch } from 'vue'
import { EVENTUAL_INSTRUCTOR_ALLOWLIST, GROUND_INSTRUCTOR_ALLOWLIST, AIRCRAFT_PRESET_CODES } from '../constants/presets'

const store = inject('store')
const props = defineProps({
  editingItem: { type: Object, default: null }
})
const emit = defineEmits(['save', 'cancel-edit', 'add-to-batch'])

const selectedType = ref('')
const isSaving = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const presetInvaIds = ref([])
const presetAeronaveIds = ref([])

const form = reactive({
  nome: '',
  observacao: '',
  invaId: null,
  alunoId: null,
  aeronaveId: null,
  modeloAeronaveId: null,
  missaoId: null,
})

watch(() => props.editingItem, (newItem) => {
  if (newItem) {
    isEditing.value = true
    editingId.value = newItem.id
    form.nome = newItem.nome || ''
    form.observacao = newItem.observacao || ''
    form.invaId = newItem.inva_id || newItem.invaId || null
    form.alunoId = newItem.aluno_id || newItem.alunoId || null
    form.aeronaveId = newItem.aeronave_id || newItem.aeronaveId || null
    form.modeloAeronaveId = newItem.modelo_aeronave_id || newItem.modeloAeronaveId || null
    form.missaoId = newItem.missao_id || newItem.missaoId || null

    if (newItem.is_aluno_inva || newItem.isAlunoInva) selectedType.value = 'aluno_inva'
    else if ((newItem.is_aeronave || newItem.isAeronave) && (newItem.is_missao || newItem.isMissao)) selectedType.value = 'ae_missao'
    else if ((newItem.is_inva || newItem.isInva) && (newItem.is_missao || newItem.isMissao)) selectedType.value = 'inva_missao'
    else if ((newItem.is_modelo || newItem.isModelo) && (newItem.is_missao || newItem.isMissao)) selectedType.value = 'mod_missao'
    else if (newItem.is_inva || newItem.isInva) selectedType.value = 'inva_only'
    else if (newItem.is_aluno || newItem.isAluno) selectedType.value = 'aluno_only'
    else selectedType.value = ''
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.nome = ''; form.observacao = ''; form.invaId = null; form.alunoId = null;
  form.aeronaveId = null; form.modeloAeronaveId = null; form.missaoId = null;
  selectedType.value = ''
  isEditing.value = false
  editingId.value = null
}

async function handleSave() {
  const payload = {
    id: editingId.value,
    nome: form.nome,
    observacao: form.observacao,
    selectedType: selectedType.value,
    form: { ...form }
  }
  emit('save', payload)
}

function handleApplyInvaPreset() {
  const allResults = []
  const invaIds = Array.isArray(presetInvaIds.value) ? [...presetInvaIds.value] : []
  invaIds.forEach(invaId => {
    const res = applyEventualInstructorPreset(invaId, store.state.MISSOES)
    allResults.push(...res)
  })
  emit('add-to-batch', allResults)
  presetInvaIds.value = []
}

function handleApplyGroundPreset() {
  const allResults = []
  const invaIds = Array.isArray(presetInvaIds.value) ? [...presetInvaIds.value] : []
  invaIds.forEach(invaId => {
    const res = applyGroundInstructorPreset(invaId, store.state.MISSOES)
    allResults.push(...res)
  })
  emit('add-to-batch', allResults)
  presetInvaIds.value = []
}

function handleApplyAnacPreset() {
  const allResults = []
  const invaIds = Array.isArray(presetInvaIds.value) ? [...presetInvaIds.value] : []
  invaIds.forEach(invaId => {
    const res = applyAnacCheckerPreset(invaId, store.state.MISSOES)
    allResults.push(...res)
  })
  emit('add-to-batch', allResults)
  presetInvaIds.value = []
}

function handleApplyStandardPreset() {
  const allResults = []
  const invaIds = Array.isArray(presetInvaIds.value) ? [...presetInvaIds.value] : []
  invaIds.forEach(invaId => {
    const res = applyStandardInstructorPreset(invaId, store.state.MISSOES)
    allResults.push(...res)
  })
  emit('add-to-batch', allResults)
  presetInvaIds.value = []
}

function handleApplyAircraftPreset(type) {
  const allResults = []
  const aircraftIds = Array.isArray(presetAeronaveIds.value) ? [...presetAeronaveIds.value] : []
  aircraftIds.forEach(aircraftId => {
    const res = generateAircraftPreset(type, aircraftId)
    allResults.push(...res)
  })
  emit('add-to-batch', allResults)
  presetAeronaveIds.value = []
}

function applyEventualInstructorPreset(invaId, allMissions) {
  const inva = store.state.INVAS.find(i => String(i.id) == String(invaId))
  const invaNome = inva ? inva.nome : 'Instrutor'
  const generated = []
  allMissions.forEach(mission => {
    let isAuthorized = false
    const missionName = (mission.nome || '').toUpperCase()
    const courseName = (mission.curso?.nome || '').toUpperCase()
    const normalizedMissionName = missionName.replace(/\s+/g, '')
    
    const checkKeyword = (k) => courseName.includes(String(k).toUpperCase())
    const checkMission = (code) => normalizedMissionName.includes(String(code).replace(/\s+/g, '').toUpperCase())

    if (EVENTUAL_INSTRUCTOR_ALLOWLIST.PPA.keywords.some(checkKeyword)) {
      isAuthorized = EVENTUAL_INSTRUCTOR_ALLOWLIST.PPA.authorizedMissions.some(checkMission)
    } else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.keywords.some(checkKeyword)) {
      const isAllowed = EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.authorizedMissions.some(checkMission)
      const isExcluded = EVENTUAL_INSTRUCTOR_ALLOWLIST.PCA.excludedMissions?.some(checkMission)
      isAuthorized = isAllowed && !isExcluded
    } else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.INVA_CFI.keywords.some(checkKeyword)) {
      isAuthorized = false
    } else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.APERFEICOAMENTO.keywords.some(checkKeyword)) {
      const isEval = EVENTUAL_INSTRUCTOR_ALLOWLIST.APERFEICOAMENTO.evaluationKeywords.some(k => missionName.includes(String(k).toUpperCase()))
      isAuthorized = !isEval
    } else if (EVENTUAL_INSTRUCTOR_ALLOWLIST.ADMIN.keywords.some(checkKeyword)) {
      isAuthorized = EVENTUAL_INSTRUCTOR_ALLOWLIST.ADMIN.authorizedMissions.some(checkMission)
    }
    
    if (!isAuthorized) {
      const alreadyInDB = store.state.RESTRICTS.some(r => 
        (String(r.invaId || r.inva_id) == String(invaId)) && 
        (String(r.missaoId || r.missao_id) == String(mission.id))
      )
      
      if (!alreadyInDB) {
        generated.push({
          nome: `[Preset] ${invaNome} - Restrição ${mission.nome}`,
          observacao: `Restrição automática (Preset Instrutor Eventual): Não autorizado para missão ${mission.nome}`,
          invaId: invaId, missaoId: mission.id, isInva: true, isMissao: true
        })
      }
    }
  })
  return generated
}

function applyGroundInstructorPreset(invaId, allMissions) {
  const inva = store.state.INVAS.find(i => String(i.id) == String(invaId))
  const invaNome = inva ? inva.nome : 'Instrutor'
  const generated = []
  allMissions.forEach(mission => {
    const mName = (mission.nome || '').toUpperCase()
    const normalizedMName = mName.replace(/\s+/g, '')
    const isAuthorized = GROUND_INSTRUCTOR_ALLOWLIST.some(pattern => 
      normalizedMName.includes(String(pattern).replace(/\s+/g, '').toUpperCase())
    )
    if (!isAuthorized) {
      const alreadyInDB = store.state.RESTRICTS.some(r => 
        (String(r.invaId || r.inva_id) == String(invaId)) && 
        (String(r.missaoId || r.missao_id) == String(mission.id))
      )
      
      if (!alreadyInDB) {
        generated.push({
          nome: `Restrição automática: Instrutor de Solo (${mission.nome})`,
          observacao: `Instrutor de Solo autorizado apenas para Mockups, Monitorias e Navegações Solo. Missão "${mission.nome}" bloqueada.`,
          invaId: invaId, missaoId: mission.id, isInva: true, isMissao: true
        })
      }
    }
  })
  return generated
}

function applyAnacCheckerPreset(invaId, allMissions) {
  const inva = store.state.INVAS.find(i => String(i.id) == String(invaId))
  const invaNome = inva ? inva.nome : 'Checador'
  const generated = []
  const authorizedMissions = EVENTUAL_INSTRUCTOR_ALLOWLIST.ANAC.authorizedMissions.map(m => String(m).replace(/\s+/g, '').toUpperCase())
  const authorizedCourses = EVENTUAL_INSTRUCTOR_ALLOWLIST.ANAC.keywords.map(k => String(k).toUpperCase())
  
  allMissions.forEach(mission => {
    const mName = (mission.nome || '').toUpperCase()
    const courseName = (mission.curso?.nome || '').toUpperCase()
    const normalizedMName = mName.replace(/\s+/g, '')
    
    const isAuthorized = authorizedCourses.some(k => courseName.includes(k)) && 
                         authorizedMissions.some(authM => normalizedMName.includes(authM))
    
    if (!isAuthorized) {
      const alreadyInDB = store.state.RESTRICTS.some(r => 
        (String(r.invaId || r.inva_id) == String(invaId)) && 
        (String(r.missaoId || r.missao_id) == String(mission.id))
      )
      
      if (!alreadyInDB) {
        generated.push({
          nome: `[Preset ANAC] ${invaNome} - Restrição ${mission.nome}`,
          observacao: `Checador ANAC autorizado apenas para missões de Cheque nos cursos PPA, PC e INVA. Missão "${mission.nome}" bloqueada.`,
          invaId: invaId, missaoId: mission.id, isInva: true, isMissao: true
        })
      }
    }
  })
  return generated
}

function applyStandardInstructorPreset(invaId, allMissions) {
  const inva = store.state.INVAS.find(i => String(i.id) == String(invaId))
  const invaNome = inva ? inva.nome : 'Instrutor'
  const generated = []
  const restrictedMissions = EVENTUAL_INSTRUCTOR_ALLOWLIST.STANDARD.restrictedMissions.map(m => String(m).replace(/\s+/g, '').toUpperCase())
  const restrictedCourses = EVENTUAL_INSTRUCTOR_ALLOWLIST.STANDARD.restrictedCourses.map(k => String(k).toUpperCase())
  
  allMissions.forEach(mission => {
    const mName = (mission.nome || '').toUpperCase()
    const courseName = (mission.curso?.nome || '').toUpperCase()
    const normalizedMName = mName.replace(/\s+/g, '')
    
    const shouldRestrict = restrictedCourses.some(k => courseName.includes(k)) && 
                          restrictedMissions.some(restM => normalizedMName.includes(restM))
    
    if (shouldRestrict) {
      const alreadyInDB = store.state.RESTRICTS.some(r => 
        (String(r.invaId || r.inva_id) == String(invaId)) && 
        (String(r.missaoId || r.missao_id) == String(mission.id))
      )
      
      if (!alreadyInDB) {
        generated.push({
          nome: `[Preset Padrão] ${invaNome} - Restrição ${mission.nome}`,
          observacao: `Missão de Cheque ("${mission.nome}") restrita para instrutores padrão. Apenas checadores ANAC autorizados.`,
          invaId: invaId, missaoId: mission.id, isInva: true, isMissao: true
        })
      }
    }
  })
  return generated
}

function generateAircraftPreset(type, aircraftId) {
  const ae = store.state.AERONAVES.find(a => String(a.id) == String(aircraftId))
  const aeNome = ae ? ae.nome : 'Aeronave'
  const generated = []
  const restrictedCodes = type === 'diurna' ? AIRCRAFT_PRESET_CODES.DIURNA_ONLY_RESTRICTED : AIRCRAFT_PRESET_CODES.VFR_ONLY_RESTRICTED
  const typeLabel = type === 'diurna' ? 'Somente Diurna' : 'VFR Only'
  store.state.MISSOES.forEach(mission => {
    const missionName = (mission.nome || '').toUpperCase()
    const normalizedMissionName = missionName.replace(/\s+/g, '')
    const isRestricted = restrictedCodes.some(code => normalizedMissionName.includes(code.replace(/\s+/g, '').toUpperCase()))
    if (isRestricted) {
      // Avoid duplication against DB
      const alreadyInDB = store.state.RESTRICTS.some(r => 
        (String(r.aeronaveId || r.aeronave_id) == String(aircraftId)) && 
        (String(r.missaoId || r.missao_id) == String(mission.id))
      )

      if (!alreadyInDB) {
        generated.push({
          nome: `[Preset AE] ${aeNome} - ${typeLabel} (${mission.nome})`,
          observacao: `Restrição automática (${typeLabel}): Aeronave não homologada/equipada para esta missão.`,
          aeronaveId: aircraftId, missaoId: mission.id, isAeronave: true, isMissao: true
        })
      }
    }
  })
  return generated
}
</script>

<style scoped>
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

.form-group { margin-bottom: 18px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #5a6370; text-transform: uppercase; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #d8dee8; border-radius: 8px;
  font-size: 13px; color: #1d2951; outline: none; transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.form-textarea { height: 80px; resize: none; }

.multi-select { height: 120px; padding: 8px; }
.select-hint { font-size: 11px; color: #64748b; margin-top: 6px; font-style: italic; }

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

/* Preset Card */
.preset-card { margin-top: 24px; border-left: 6px solid #3b82f6; }
.preset-section { margin-bottom: 20px; }
.preset-divider {
  height: 1px; background: #e2e8f0; margin: 20px 0; position: relative;
}
.preset-divider::after {
  content: 'OU'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #fff; padding: 0 10px; font-size: 10px; font-weight: 800; color: #94a3b8;
}
.preset-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-apply-preset {
  width: 100%; padding: 12px; background: #3b82f6; color: #fff; border: none;
  border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.btn-apply-preset.secondary { background: #f1f5f9; color: #1d2951; border: 1px solid #cbd5e1; }
.btn-apply-preset:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
.btn-apply-preset.secondary:hover:not(:disabled) { background: #e2e8f0; border-color: #94a3b8; }
.btn-apply-preset:disabled { opacity: 0.5; cursor: not-allowed; }
.preset-help { margin: 12px 0 0; font-size: 11px; color: #64748b; line-height: 1.4; font-style: italic; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>