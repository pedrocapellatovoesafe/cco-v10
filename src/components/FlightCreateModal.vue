<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📅 Adicionar Novo Voo</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-slot-info">
          <p><strong>Escala:</strong> {{ slot?.data }} - {{ slot?.hora }}</p>
          <p><strong>Barra:</strong> {{ slot?.barra }}</p>
        </div>

        <div class="form-container">
          <!-- Aluno Searchable Select -->
          <div class="form-group">
            <label>Aluno:</label>
            <div class="searchable-select">
              <input 
                type="text" 
                v-model="alunoSearch" 
                @focus="alunoDropdownOpen = true"
                placeholder="Pesquisar aluno..."
                class="form-input search-input"
              />
              <div v-if="alunoDropdownOpen" class="select-dropdown">
                <div 
                  v-for="a in alunosFiltered" 
                  :key="a.id" 
                  @click="selectAluno(a)"
                  class="dropdown-item"
                  :class="{ active: form.alunoId === a.id }"
                >
                  {{ a.nome }}
                </div>
                <div v-if="alunosFiltered.length === 0" class="dropdown-no-results">
                  Nenhum aluno encontrado
                </div>
              </div>
            </div>
            <div v-if="selectedAlunoName" class="selection-badge">
              Selecionado: <strong>{{ selectedAlunoName }}</strong>
              <button @click="clearAluno" class="btn-clear">×</button>
            </div>
          </div>

          <!-- Instrutor filtered by Base -->
          <div class="form-group">
            <label>Instrutor (INVA):</label>
            <select v-model="form.invaId" class="form-select">
              <option :value="null">Selecione o instrutor...</option>
              <option v-for="i in invasFiltered" :key="i.id" :value="i.id">{{ i.nome }}</option>
            </select>
            <p class="select-hint" v-if="slot">Exibindo apenas instrutores da base {{ slot.barra.includes('CPQ') ? 'CPQ' : 'SJK' }}</p>
          </div>

          <div class="form-group">
            <label>Aeronave:</label>
            <select v-model="form.aeronaveId" class="form-select">
              <option :value="null">Selecione a aeronave...</option>
              <option v-for="ae in aeronavesFiltered" :key="ae.id" :value="ae.id">{{ ae.nome }}</option>
            </select>
          </div>

          <!-- Missão Searchable Select -->
          <div class="form-group">
            <label>Missão:</label>
            <div class="searchable-select">
              <input 
                type="text" 
                v-model="missaoSearch" 
                @focus="missaoDropdownOpen = true"
                placeholder="Pesquisar missão..."
                class="form-input search-input"
              />
              <div v-if="missaoDropdownOpen" class="select-dropdown">
                <div 
                  v-for="m in missoesFiltered" 
                  :key="m.id" 
                  @click="selectMissao(m)"
                  class="dropdown-item"
                  :class="{ active: form.missaoId === m.id }"
                >
                  {{ m.nome }}
                </div>
                <div v-if="missoesFiltered.length === 0" class="dropdown-no-results">
                  Nenhuma missão encontrada
                </div>
              </div>
            </div>
            <div v-if="selectedMissaoName" class="selection-badge">
              Selecionada: <strong>{{ selectedMissaoName }}</strong>
              <button @click="clearMissao" class="btn-clear">×</button>
            </div>
          </div>

          <div class="form-group">
            <label>Status:</label>
            <select v-model="form.statusSlotId" class="form-select">
              <option :value="null">Selecione o status...</option>
              <option v-for="st in store.state.STATUSES" :key="st.id" :value="st.id">{{ st.nome.toUpperCase() }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Observações:</label>
            <textarea v-model="form.obs" class="form-textarea" placeholder="Opcional..."></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
        <button class="btn-save" @click="handleSave" :disabled="isSaving || !form.alunoId || !form.statusSlotId">
          {{ isSaving ? 'Salvando...' : 'Cadastrar Voo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, inject, computed, watch, onMounted, onUnmounted } from 'vue'

const store = inject('store')

const props = defineProps({
  isOpen: Boolean,
  slot: Object
})

const emit = defineEmits(['close', 'save'])

const isSaving = ref(false)

const alunoSearch = ref('')
const alunoDropdownOpen = ref(false)
const selectedAlunoName = ref('')

const missaoSearch = ref('')
const missaoDropdownOpen = ref(false)
const selectedMissaoName = ref('')

// Close dropdowns on outside click
const handleClickOutside = (event) => {
  if (!event.target.closest('.searchable-select')) {
    alunoDropdownOpen.value = false
    missaoDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const form = reactive({
  alunoId: null,
  invaId: null,
  aeronaveId: null,
  missaoId: null,
  statusSlotId: null,
  obs: ''
})

// Initialize form when slot changes
watch(() => props.slot, (newSlot) => {
  if (newSlot) {
    form.alunoId = null
    form.invaId = null
    form.aeronaveId = null
    form.missaoId = null
    form.statusSlotId = store.state.STATUSES.find(s => s.nome.toUpperCase() === 'CONFIRMADO')?.id || null
    form.obs = ''
    
    alunoSearch.value = ''
    selectedAlunoName.value = ''
    missaoSearch.value = ''
    selectedMissaoName.value = ''
  }
})

const alunosFiltered = computed(() => {
  const list = store.state.ALUNOS || []
  if (!alunoSearch.value) return list.slice(0, 10)
  const s = alunoSearch.value.toLowerCase()
  return list.filter(a => a.nome.toLowerCase().includes(s)).slice(0, 10)
})

const missoesFiltered = computed(() => {
  const list = store.state.MISSOES || []
  if (!missaoSearch.value) return list.slice(0, 10)
  const s = missaoSearch.value.toLowerCase()
  return list.filter(m => m.nome.toLowerCase().includes(s)).slice(0, 10)
})

function selectAluno(aluno) {
  form.alunoId = aluno.id
  selectedAlunoName.value = aluno.nome
  alunoSearch.value = ''
  alunoDropdownOpen.value = false
}

function clearAluno() {
  form.alunoId = null
  selectedAlunoName.value = ''
}

function selectMissao(missao) {
  form.missaoId = missao.id
  selectedMissaoName.value = missao.nome
  missaoSearch.value = ''
  missaoDropdownOpen.value = false
}

function clearMissao() {
  form.missaoId = null
  selectedMissaoName.value = ''
}

const invasFiltered = computed(() => {
  if (!props.slot) return store.state.INVAS
  return store.getInvasByBarra(props.slot.barra)
})

const aeronavesFiltered = computed(() => {
  if (!props.slot) return store.state.AERONAVES
  return store.getAeronavesByBarra(props.slot.barra)
})

async function handleSave() {
  if (!props.slot) return
  
  isSaving.value = true
  try {
    const payload = {
      ...props.slot,
      alunoId: form.alunoId,
      invaId: form.invaId,
      aeronaveId: form.aeronaveId,
      missaoId: form.missaoId,
      statusSlotId: form.statusSlotId,
      obs: form.obs
    }
    
    const res = await store.saveSlot(payload)
    if (res.success) {
      emit('save')
      emit('close')
    } else {
      store.showAlert(res.error, 'Erro ao Cadastrar', 'error')
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.modal-header { padding: 18px 22px; background: #f8f9fa; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; font-size: 16px; color: var(--primary); font-weight: 800; }
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
}
.modal-close:hover { background: rgba(0,0,0,0.1); color: var(--primary); }

.modal-body { padding: 22px; max-height: 70vh; overflow-y: auto; }
.modal-slot-info {
  background: var(--bg-main);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}
.modal-slot-info p { margin: 0; font-size: 13px; color: #334155; font-weight: 600; }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #5a6370; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 10px; border: 1px solid #d8dee8; border-radius: 8px;
  font-size: 13px; color: var(--primary); outline: none;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--primary); }
.form-textarea { height: 60px; resize: none; }

.searchable-select {
  position: relative;
  width: 100%;
}
.search-input {
  background: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 10px center;
  padding-left: 34px;
}
.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  margin-top: 4px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 10px 14px;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.2s;
}
.dropdown-item:hover { background: var(--bg-main); }
.dropdown-item.active { background: var(--primary); color: #fff; }
.dropdown-no-results {
  padding: 10px 14px;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  text-align: center;
}

.selection-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e0e7ff;
  color: var(--primary);
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 12px;
}
.selection-badge strong { margin: 0 4px; }
.btn-clear {
  background: #fff;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ef4444;
  cursor: pointer;
  line-height: 1;
}

.select-hint { font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic; }

.modal-footer { padding: 16px 22px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; background: #f8f9fa; }
.btn-cancel { background: #fff; color: #5a6370; border: 1px solid #d8dee8; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-save { background: var(--primary); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-save:hover { background: var(--primary); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
