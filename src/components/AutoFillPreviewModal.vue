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
                    type="checkbox" 
                    :value="sugg.slotId" 
                    v-model="selectedIds" 
                    class="preview-checkbox"
                  />
                </td>
                <td class="font-bold">{{ sugg.hora }}</td>
                <td>{{ sugg.barra }}</td>
                <td class="font-semibold">{{ sugg.ae || '—' }}</td>
                <td class="font-semibold text-primary">{{ sugg.aluno }}</td>
                <td class="font-bold text-success">{{ sugg.suggestedInva }}</td>
                <td>
                  <div v-if="sugg.alerts.length === 0" class="badge-no-alerts">
                    Sem alertas
                  </div>
                  <div v-else class="alerts-list">
                    <span v-for="(alert, index) in sugg.alerts" :key="index" class="alert-item">
                      ⚠️ {{ alert }}
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

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.suggestions) {
      selectedIds.value = props.suggestions.map(s => s.slotId)
    }
  },
  { immediate: true }
)

watch(
  () => props.suggestions,
  (newSuggestions) => {
    if (newSuggestions) {
      selectedIds.value = newSuggestions.map(s => s.slotId)
    }
  },
  { immediate: true }
)

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = props.suggestions.map(s => s.slotId)
  } else {
    selectedIds.value = []
  }
}

const isAllSelected = computed(() => {
  return props.suggestions && props.suggestions.length > 0 && selectedIds.value.length === props.suggestions.length
})

const handleConfirm = () => {
  const approved = props.suggestions.filter(s => selectedIds.value.includes(s.slotId))
  emit('confirm', approved)
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
</style>
