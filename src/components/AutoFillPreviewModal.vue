<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content modal-autofill">
      <div class="modal-header">
        <h3>✨ Preenchimento Automático da Escala</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <p class="intro-text">
          Confira abaixo as sugestões de alocação de instrutores para o dia <strong>{{ store.state.currentViewDate }}</strong>. 
          O algoritmo analisou as disponibilidades e restrições para sugerir a menor quantidade de alertas possíveis.
        </p>

        <!-- Painel explicativo dos critérios do algoritmo -->
        <div class="algorithm-info-card">
          <div class="card-header" @click="isCriteriaExpanded = !isCriteriaExpanded">
            <span class="card-title">
              <span class="sparkle-icon">⚙️</span>
              Como as sugestões são calculadas?
            </span>
            <span class="toggle-arrow" :class="{ rotated: isCriteriaExpanded }">▼</span>
          </div>
          <transition name="fade-slide">
            <div v-show="isCriteriaExpanded" class="card-content">
              <p class="criteria-intro">
                O algoritmo de preenchimento automático analisa todos os slots sem instrutor e os ordena por nível de restrição. Em seguida, busca o melhor instrutor candidato com base nas seguintes regras de pontuação:
              </p>
              <div class="criteria-grid">
                <div class="criterion-item">
                  <div class="criterion-icon">📅</div>
                  <div class="criterion-details">
                    <strong>Disponibilidade &amp; Restrições</strong>
                    <span>Filtra apenas instrutores disponíveis na data e sem restrições ou impedimentos operacionais cadastrados.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">🚫</div>
                  <div class="criterion-details">
                    <strong>Conflito de Horário</strong>
                    <span>Evita alocações simultâneas para o mesmo instrutor no mesmo horário.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">🔀</div>
                  <div class="criterion-details">
                    <strong>Troca de Aluno em Sequência</strong>
                    <span>Tenta ativamente evitar e resolver trocas consecutivas de aluno para o mesmo instrutor, inclusive rotacionando horários adjacentes se necessário.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">⏱️</div>
                  <div class="criterion-details">
                    <strong>Equilíbrio de Horas (Jornada)</strong>
                    <span>Prioriza instrutores com menor saldo de horas voadas no mês (relação planejado x realizado) para equilibrar a escala.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">🎯</div>
                  <div class="criterion-details">
                    <strong>Consolidação de Escala</strong>
                    <span>Dá preferência a instrutores que já possuem alguma alocação no dia ou que já estão de sobreaviso acionado.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">🔄</div>
                  <div class="criterion-details">
                    <strong>Aulas Consecutivas</strong>
                    <span>Bonifica a alocação do mesmo instrutor para aulas consecutivas com o mesmo aluno ou mesma aeronave.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">📍</div>
                  <div class="criterion-details">
                    <strong>Base Operacional</strong>
                    <span>Prioriza instrutores lotados na mesma base física do slot de voo correspondente.</span>
                  </div>
                </div>
                <div class="criterion-item">
                  <div class="criterion-icon">⚠️</div>
                  <div class="criterion-details">
                    <strong>Minimização de Alertas</strong>
                    <span>Avalia as regras gerais de validação (como Limite de Jornada) e busca a opção com menor impacto de alertas.</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <div v-if="suggestions.length === 0" class="empty-state">
          <div class="info-icon">🎉</div>
          <p>Todos os slots com alunos já possuem instrutores alocados para hoje!</p>
        </div>

        <div v-else class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll" 
                    class="preview-checkbox"
                  />
                </th>
                <th>Horário</th>
                <th>Barra</th>
                <th>Aeronave</th>
                <th>Aluno</th>
                <th>Instrutor Sugerido</th>
                <th>Alertas Gerados</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sugg in suggestions" :key="sugg.slotId" class="preview-row">
                <td style="text-align: center;">
                  <input 
                    v-if="sugg.suggestedInvaId"
                    type="checkbox" 
                    :value="sugg.slotId" 
                    v-model="selectedIds" 
                    class="preview-checkbox"
                  />
                  <span v-else title="Nenhum instrutor elegível sem restrições">⚠️</span>
                </td>
                <td class="font-bold">{{ sugg.hora }}</td>
                <td>{{ sugg.barra }}</td>
                <td class="font-semibold">{{ sugg.ae || '—' }}</td>
                <td class="font-semibold text-primary">{{ sugg.aluno }}</td>
                <td class="font-bold" :class="sugg.suggestedInvaId ? 'text-success' : 'text-danger'">
                  {{ sugg.suggestedInva }}
                </td>
                <td>
                  <div v-if="sugg.alerts.length === 0 && (!sugg.restrictedOptions || sugg.restrictedOptions.length === 0)" class="badge-no-alerts">
                    Sem alertas
                  </div>
                  <div v-else class="alerts-list">
                    <span v-for="(alert, index) in sugg.alerts" :key="index" class="alert-item">
                      ⚠️ {{ alert }}
                    </span>
                    <span v-for="(group, gIdx) in getGroupedRestrictedOptions(sugg.restrictedOptions)" :key="'g-'+gIdx" class="alert-item text-restriction-info">
                      ℹ️ Restritos para {{ group.restriction }}: {{ group.invasList }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
        <button 
          v-if="suggestions.length > 0" 
          class="btn-confirm-autofill" 
          :disabled="selectedIds.length === 0"
          @click="handleConfirm"
        >
          Confirmar e Aplicar ({{ selectedIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, watch, computed } from 'vue'
const store = inject('store')

const props = defineProps({
  isOpen: Boolean,
  suggestions: Array
})

const emit = defineEmits(['close', 'confirm'])

const selectedIds = ref([])
const isCriteriaExpanded = ref(true)

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.suggestions) {
      selectedIds.value = props.suggestions.filter(s => s.suggestedInvaId).map(s => s.slotId)
    }
  },
  { immediate: true }
)

watch(
  () => props.suggestions,
  (newSuggestions) => {
    if (newSuggestions) {
      selectedIds.value = newSuggestions.filter(s => s.suggestedInvaId).map(s => s.slotId)
    }
  },
  { immediate: true }
)

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = props.suggestions.filter(s => s.suggestedInvaId).map(s => s.slotId)
  } else {
    selectedIds.value = []
  }
}

const isAllSelected = computed(() => {
  const fillable = props.suggestions ? props.suggestions.filter(s => s.suggestedInvaId) : []
  return fillable.length > 0 && selectedIds.value.length === fillable.length
})

const handleConfirm = () => {
  const approved = props.suggestions.filter(s => selectedIds.value.includes(s.slotId))
  emit('confirm', approved)
}

const getGroupedRestrictedOptions = (restrictedOptions) => {
  if (!restrictedOptions || restrictedOptions.length === 0) return []
  
  const groups = {}
  restrictedOptions.forEach(opt => {
    const key = opt.restrictions.join(', ') || 'Impedimento Operacional'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(opt.invaName)
  })
  
  return Object.entries(groups).map(([restriction, invas]) => ({
    restriction,
    invasList: invas.join(', ')
  }))
}
</script>

<style scoped>
.modal-overlay { 
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(14, 38, 72, 0.4); 
  display: flex; align-items: center; justify-content: center; 
  z-index: 3000; backdrop-filter: blur(5px); 
}
.modal-content { 
  background: #fff; width: 100%; max-width: 900px; 
  border-radius: 16px; overflow: hidden; 
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column;
  max-height: 85vh;
}
.modal-header { 
  padding: 18px 24px; background: #f8fafc; 
  display: flex; align-items: center; justify-content: space-between; 
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  margin: 0; font-size: 15px; font-weight: 800;
  color: var(--primary); text-transform: uppercase;
  letter-spacing: 0.5px;
}
.modal-close {
  background: rgba(0, 0, 0, 0.05); border: none;
  width: 30px; height: 30px; border-radius: 50%;
  font-size: 20px; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
}
.modal-close:hover {
  background: rgba(0, 0, 0, 0.1); color: var(--primary);
}
.modal-body { 
  padding: 24px; overflow-y: auto; flex: 1;
}
.intro-text {
  margin: 0 0 18px; font-size: 13.5px; color: #475569;
  line-height: 1.5;
}
.empty-state {
  text-align: center; padding: 40px 20px;
  border: 2px dashed #e2e8f0; border-radius: 12px;
  background: #f8fafc;
}
.info-icon { font-size: 44px; margin-bottom: 12px; }
.empty-state p { font-size: 14px; font-weight: 700; color: #64748b; margin: 0; }

.preview-table-container {
  border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.preview-table {
  width: 100%; border-collapse: collapse; font-size: 12.5px;
}
.preview-table th {
  background: #f8fafc; color: #64748b; font-weight: 700;
  text-transform: uppercase; font-size: 10.5px;
  padding: 12px 16px; text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.preview-table td {
  padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.preview-row:hover { background: #f8fafc; }
.preview-row:last-child td { border-bottom: none; }

.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-primary { color: var(--primary); }
.text-success { color: #16a34a; }

.badge-no-alerts {
  background: #dcfce7; color: #15803d;
  font-size: 10.5px; font-weight: 700;
  padding: 3px 8px; border-radius: 6px;
  display: inline-block;
}
.alerts-list {
  display: flex; flex-direction: column; gap: 4px;
}
.alert-item {
  font-size: 11px; color: #b45309; font-weight: 600;
  line-height: 1.3;
}
.text-restriction-info {
  color: #475569;
  font-weight: 500;
}

.modal-footer { 
  padding: 16px 24px; border-top: 1px solid #e2e8f0; 
  display: flex; justify-content: flex-end; background: #f8fafc;
}
.btn-cancel { 
  background: #e2e8f0; color: #475569; border: none; 
  padding: 10px 20px; border-radius: 8px; font-weight: 700; 
  cursor: pointer; margin-right: 12px; transition: all 0.2s;
}
.btn-cancel:hover { background: #cbd5e1; }
.btn-confirm-autofill { 
  background: #16a34a; color: #fff; border: none; 
  padding: 10px 20px; border-radius: 8px; font-weight: 700; 
  cursor: pointer; transition: all 0.2s;
}
.btn-confirm-autofill:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
.btn-confirm-autofill:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
}
.preview-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #16a34a;
}

/* Algoritmo Info Card styles */
.algorithm-info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}
.algorithm-info-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.card-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: #f1f5f9;
  user-select: none;
  transition: background 0.2s ease;
}
.card-header:hover {
  background: #e2e8f0;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.sparkle-icon {
  font-size: 14px;
}
.toggle-arrow {
  font-size: 10px;
  color: #64748b;
  transition: transform 0.2s ease;
}
.toggle-arrow.rotated {
  transform: rotate(180deg);
}
.card-content {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
}
.criteria-intro {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: #475569;
  line-height: 1.5;
}
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 12px;
}
.criterion-item {
  display: flex;
  gap: 12px;
  background: #ffffff;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}
.criterion-item:hover {
  border-color: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.criterion-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f8fafc;
  border-radius: 8px;
  flex-shrink: 0;
}
.criterion-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.criterion-details strong {
  font-size: 12px;
  color: #1e293b;
  font-weight: 700;
}
.criterion-details span {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
