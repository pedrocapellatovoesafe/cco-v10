<template>
  <div class="slot-grid-container">
    <!-- Date Pagination (Escalas Disponíveis) -->
    <div class="date-pagination" v-if="store.availableDates.value.length > 0">
      <div class="pag-label">Escalas disponíveis:</div>
      <div class="pag-btns">
        <button 
          v-for="date in store.availableDates.value" 
          :key="date"
          :class="['date-btn', store.currentViewDate.value === date ? 'active' : '']"
          @click="store.setCurrentViewDate(date)"
        >
          {{ date }}
        </button>
      </div>
    </div>

    <!-- Painel de Aeronaves Cadastradas Ativas -->
    <div class="aeronaves-panel" v-if="activeAeronaves.length > 0">
      <div class="panel-header">
        <span class="panel-title">✈️ Frota Ativa &amp; Horas Disponíveis</span>
        <span class="panel-subtitle">Saldo de horas cadastradas no sistema</span>
      </div>
      <div class="aeronaves-scroll">
        <div 
          v-for="ae in activeAeronaves" 
          :key="ae.id" 
          class="aeronave-card"
        >
          <div class="ae-card-header">
            <span class="ae-prefix">{{ ae.nome }}</span>
          </div>
          <div class="ae-card-body">
            <span class="ae-model-label">{{ ae.modeloAeronave?.nome || 'Modelo N/A' }}</span>
            <span 
              class="ae-hours-value" 
              :class="store.getAeronaveHoursClass(ae.horasDisponiveis)"
            >
              {{ ae.horasDisponiveis != null ? parseFloat(ae.horasDisponiveis).toFixed(1) : '0.0' }}h
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Base -->
    <div class="tabs">
      <button :class="['tab-btn', store.state.activeTab === 'SJK' ? 't-sjk' : '']" @click="store.state.activeTab = 'SJK'">✈ SJK</button>
      <button :class="['tab-btn', store.state.activeTab === 'CPQ' ? 't-cpq' : '']" @click="store.state.activeTab = 'CPQ'">✈ CPQ</button>
    </div>

    <!-- Editor Grid -->
    <div class="tab-panel active">
      <div v-for="block in (store.scheduleBlocks?.value?.[store.state.activeTab] || [])" :key="block.id" class="barra-bloco">
        <div class="bh" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
          <div class="hd"><div class="d1">{{ store.state.parsedDate }}</div><div class="d2">{{ store.state.parsedDayName }}</div></div>
          <div v-for="slot in (block.slots || [])" :key="slot.id" class="hh" draggable="true"
            @dragstart="onDragStart(slot.id)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(slot.id)"
            @dragleave="onDragLeave(slot.id)"
            @drop.prevent="onDropSlot(slot.id)"
          >
            {{ slot.hora }} <span class="drag-indicator">⠿</span>
          </div>
        </div>
        <div class="barra-body">
          <div class="brow" v-for="label in rowLabels" :key="label" :style="{ gridTemplateColumns: `110px repeat(${(block.slots || []).length}, 1fr)` }">
            <div class="rl">{{ label }}</div>
            <template v-for="slot in (block.slots || [])" :key="slot.id + label">
              <div v-if="label === 'Aluno'" class="sc" :class="slot.aluno ? '' : 'sc-empty'">
                <button v-if="slot.apiId" class="btn-delete-slot" @click.stop="$emit('open-delete-modal', slot)" title="Excluir Registro">×</button>
                <div class="sv sv-aluno">
                  <input 
                    v-if="slot.apiId"
                    type="checkbox" 
                    v-model="slot.isChecked" 
                    @change="$emit('update-checked', slot)"
                    class="slot-checkbox"
                    title="Marcar como conferido"
                  />
                  <span v-if="slot.aluno" class="aluno-name" :title="slot.aluno">{{ slot.aluno }}</span>
                  <span v-else-if="slot.apiId" class="warning-text">ALUNO NÃO INFORMADO</span>
                </div>
              </div>
              <div v-else-if="label === 'Instrutor'" :class="store.getSlotClass(slot)">
                <select class="slot-input" v-model="slot.inva" @change="$emit('update-instructor', slot.id, slot.inva)">
                  <option value="">—</option>
                  <option v-for="inva in (store.getInvasByBarra ? store.getInvasByBarra(slot.barra, slot.inva) : [])" :key="inva.id" :value="inva.nome">
                    {{ inva.nome }}
                  </option>
                </select>
              </div>
              <div v-else-if="label === 'Aeronave'" class="sc">
                <select class="slot-input" v-model="slot.ae" @change="$emit('update-aeronave', slot.id, slot.ae)">
                  <option value="">—</option>
                  <option v-for="aero in (store.getAeronavesByBarra ? store.getAeronavesByBarra(slot.barra, slot.ae) : [])" :key="aero.id" :value="aero.nome">
                    {{ aero.nome }}
                  </option>
                </select>
                <span 
                  v-if="slot.ae && store.getAeronaveHours(slot) != null"
                  class="ae-hours-predict"
                  :class="store.getAeronaveHoursClass(store.getAeronaveHours(slot))"
                  :title="'Previsão de horas após este voo: ' + store.getAeronaveHours(slot).toFixed(1) + 'h'"
                >
                  {{ store.getAeronaveHours(slot).toFixed(1) }}h
                </span>
              </div>
              <div v-else-if="label === 'Missão'" class="sc" :class="slot.missao ? '' : 'sc-empty'"><div class="sv">{{ slot.missao }}</div></div>
              <div v-else-if="label === 'Status'" class="sc">
                <template v-if="slot.apiId">
                  <select class="slot-input" v-model="slot.st" @change="$emit('update-status', slot.id, slot.st)">
                    <option value="">—</option>
                    <option v-for="st in store.state.STATUSES" :key="st.id" :value="st.nome.toUpperCase()">
                      {{ st.nome.toUpperCase() }}
                    </option>
                  </select>
                </template>
              </div>
              <div v-else-if="label === 'Barra'" class="sc"><div class="sv">{{ slot.barra }}</div></div>
            </template>
          </div>
        </div>

        <div class="btn-row" :style="{ gridTemplateColumns: `110px repeat(${(block.slots || []).length}, 1fr)` }">
          <div class="bl"></div>
          <div v-for="slot in (block.slots || [])" :key="slot.id + '-btn'" class="bcell">
            <div class="btn-container">
              <button class="btn-cav" :class="buttonClass(slot)" @click="handleButtonClick(slot)">
                {{ buttonLabel(slot) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'

const store = inject('store')
const dragSourceId = ref(null)
const rowLabels = ['Aluno', 'Instrutor', 'Aeronave', 'Missão', 'Status', 'Barra']

const emit = defineEmits([
  'open-delete-modal',
  'open-detail-modal',
  'open-create-modal',
  'update-instructor',
  'update-aeronave',
  'update-status',
  'update-checked',
  'swap-slots'
])

function onDragStart(id) {
  dragSourceId.value = id
}

function onDragEnd() {
  dragSourceId.value = null
}

function onDragOver(id) {}
function onDragLeave(id) {}

async function onDropSlot(id) {
  if (!dragSourceId.value || dragSourceId.value === id) return
  emit('swap-slots', dragSourceId.value, id)
  dragSourceId.value = null
}

function buttonLabel(slot) {
  const hasRestrictions = slot.serverRestrictions && slot.serverRestrictions.length > 0
  const alerts = store.getSlotAlerts(slot)
  const hasAlerts = alerts.length > 0
  const isChecked = !!slot.isChecked

  if (isChecked && (hasRestrictions || hasAlerts)) return '✅ Ok OBS*'
  if (hasRestrictions) return '🚫 Restrição'
  if (hasAlerts) return '⚠️ Atenção'
  if (!slot.aluno) return '📅 ' + (slot.st || 'Disponível')
  return '✅ Ok'
}

function buttonClass(slot) {
  const label = buttonLabel(slot)
  if (label.includes('Restrição')) return 'btn-mod-err'
  if (label.includes('Atenção')) return 'btn-mod-wrn'
  if (label.includes('Ok')) return 'btn-mod-ok'
  return 'btn-disp'
}

function handleButtonClick(slot) {
  const label = buttonLabel(slot)
  if (label.includes('Atenção') || label.includes('Restrição') || label.includes('Ok OBS*')) {
    emit('open-detail-modal', slot)
  } else if (!slot.aluno) {
    emit('open-create-modal', slot)
  }
}

// Painel de aeronaves
const activeAeronaves = computed(() => {
  const list = store.state.AERONAVES || []
  return list.filter(ae => {
    const isActive = ae.ativo !== 0 && ae.ativo !== false
    const modId = ae.modeloAeronaveId || ae.modeloAeronave?.id
    const isExcludedModel = modId == 4 || modId == 5
    return isActive && !isExcludedModel
  })
})
</script>

<style scoped>
.date-pagination {
  display: flex; align-items: center; gap: 12px; margin: 12px 0; padding: 8px 18px;
  background: #fff; border: 1px solid #dae2ec; border-radius: 14px;
}
.pag-label { font-size: 12px; font-weight: 700; color: var(--primary); }
.pag-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.date-btn {
  border: 1px solid #dae2ec; background: var(--white); color: #5a6370; padding: 5px 12px;
  border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.date-btn:hover { border-color: var(--primary); color: var(--primary); }
.date-btn.active { background: var(--primary); color: var(--white); border-color: var(--primary); }

.tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.tab-btn { padding: 10px 22px; font-size: 13px; font-weight: 700; border: none; border-radius: 999px; background: #d4d4d4; cursor: pointer; font-family: var(--font-title); }
.tab-btn.t-sjk { background: var(--primary); color: var(--white); }
.tab-btn.t-cpq { background: #1d3a52; color: var(--white); }

.barra-bloco { border-radius: 18px; overflow: hidden; box-shadow: 0 16px 30px rgba(14, 38, 72, 0.08); margin-bottom: 18px; }
.bh { display: grid; background: var(--primary); color: var(--white); font-weight: 700; font-family: var(--font-title); }
.hd { padding: 14px 16px; min-width: 110px; }
.hh { display: flex; align-items: center; justify-content: center; padding: 14px 6px; border-left: 1px solid rgba(255, 255, 255, 0.16); font-size: 13px; }
.barra-body { background: var(--white); }
.brow { display: grid; min-height: 48px; border-bottom: 1px solid #e3e9f0; }
.rl { padding: 14px 12px; background: #f6f8fb; font-size: 12px; font-weight: 700; color: #2a3b59; border-right: 1px solid #dde4ef; display: flex; align-items: center; }
.sc { border-right: 1px solid #dde4ef; display: flex; align-items: center; justify-content: center; padding: 4px 6px; position: relative; }
.sc-empty { background: var(--white) !important; }

.slot-input {
  width: 100%;
  height: 36px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: var(--white) !important;
  font-size: 11.5px;
  font-family: var(--font-text);
  padding: 0 10px;
  color: var(--primary);
  cursor: pointer;
  outline: none;
  text-align: center;
  text-align-last: center;
  transition: all 0.2s ease;
}
.sv-aluno { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; position: relative; padding: 0 25px; }
.aluno-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}
.slot-checkbox { position: absolute; left: 6px; cursor: pointer; margin: 0; flex-shrink: 0; }
.warning-text { color: #c0392b; font-weight: 800; font-size: 10px; }

.ae-hours-predict {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 8.5px;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 800;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 5;
  pointer-events: none;
}
.ae-hours-predict.high { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.ae-hours-predict.mid { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
.ae-hours-predict.low { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.btn-delete-slot { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; background: #ff4d4d; color: var(--white); border-radius: 50%; border: none; cursor: pointer; z-index: 30; }
.btn-row { display: grid; background: #f5f8fc; border-top: 1px solid #dde4ef; }

.bcell { padding: 8px 4px; display: flex; justify-content: center; }
.btn-container { width: 100%; display: flex; justify-content: center; }
.btn-cav { 
  width: 95%; 
  height: 38px; 
  border: none; 
  border-radius: 8px; 
  font-size: 11.5px; 
  font-weight: 700; 
  cursor: pointer; 
  color: var(--white) !important; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  transition: all 0.2s ease;
  font-family: var(--font-text);
}
.btn-cav:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.btn-cav:active { transform: scale(0.98); }
.btn-mod-ok { background: #27ae60; }
.btn-mod-wrn { background: #f1c40f; color: var(--white) !important; }
.btn-mod-err { background: #c0392b; }
.btn-disp { background: var(--secondary); }

.drag-indicator { cursor: grab; opacity: 0.5; margin-left: 4px; }

/* Horizontal Aircraft Panel */
.aeronaves-panel {
  background: var(--white);
  border: 1px solid #dae2ec;
  border-radius: 14px;
  padding: 16px 20px;
  margin: 12px 0 16px 0;
  box-shadow: 0 4px 12px rgba(14, 38, 72, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  font-family: var(--font-title);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-subtitle {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

.aeronaves-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-top: 6px;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.aeronaves-scroll::-webkit-scrollbar {
  height: 6px;
}

.aeronaves-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.aeronaves-scroll::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 99px;
}

.aeronave-card {
  flex: 0 0 auto;
  min-width: 140px;
  min-height: 72px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  transition: all 0.2s ease;
  cursor: default;
}

.aeronave-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  border-color: var(--secondary);
}

.ae-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ae-icon {
  font-size: 14px;
}

.ae-prefix {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
}

.ae-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ae-model-label {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.ae-hours-value {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ae-hours-value.high {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.ae-hours-value.mid {
  background: #fef9c3;
  color: #a16207;
  border: 1px solid #fef08a;
}

.ae-hours-value.low {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
</style>
