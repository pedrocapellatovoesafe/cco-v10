<template>
  <div class="screen-layout">
    <div id="cal-screen" class="calendar-screen">
      <div class="cal-header">
        <h1>📅 Escala de Trabalho — Instrutores</h1>
        <div class="cal-nav">
          <button class="btn-nav" @click="store.changeCalendarMonth(-1)">◀</button>
          <div class="cal-month">{{ store.calendarMonthLabel.value }}</div>
          <button class="btn-nav" @click="store.changeCalendarMonth(1)">▶</button>
        </div>
        <button class="btn-cal-back" @click="handleBackToEditor">Voltar ao Editor</button>
      </div>

      <div class="cal-body">
        <!-- Flight Instructors Calendar -->
        <div class="calendar-section">
          <h2>✈ Instrutores de Voo (CLT e Eventuais)</h2>
          <div class="table-wrapper">
            <table class="cal-table">
              <thead>
                <tr>
                  <th class="th-name">Instrutor</th>
                  <th 
                    v-for="day in store.calendarDays.value" 
                    :key="day.key" 
                    :style="day.isWeekend ? weekendHeaderStyle : null"
                    :class="{ 'th-today': day.day === new Date().getDate() && store.state.calendarMonthIdx === new Date().getMonth() && store.state.calendarYear === new Date().getFullYear() }"
                  >
                    {{ day.day }}<br /><span class="day-label">{{ day.weekDay }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="base in ['SJK', 'CPQ']" :key="base">
                  <tr class="section-divider"><td :colspan="store.calendarDays.value.length + 1">✈ {{ base === 'SJK' ? 'SJK — São José dos Campos' : 'CPQ — Campinas' }}</td></tr>
                  
                  <tr v-for="row in (base === 'SJK' ? flightSJK : flightCPQ)" :key="row.id + '-' + base">
                    <td class="td-name" :class="base === 'SJK' ? 'solo-sjk' : 'solo-cpq'">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
                    <td v-for="day in row.days" :key="day.key" @click="openEditModal(row, day)">
                      <div class="day-cell-static clickable" :class="day.estado + (day.isToday ? ' today' : '')" :title="`${row.nome} — ${day.key}`">
                        <div class="day-sigla">{{ day.sigla }}</div>
                        <div v-if="day.periodo" class="day-periodo">{{ day.periodo }}</div>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="(base === 'SJK' ? flightSJK : flightCPQ).length === 0">
                    <td :colspan="store.calendarDays.value.length + 1" class="td-empty">Nenhum instrutor de voo encontrado para esta base.</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ground Instructors Calendar -->
        <div class="calendar-section">
          <h2>🏢 Instrutores de Solo</h2>
          <div class="table-wrapper">
            <table class="cal-table">
              <thead>
                <tr>
                  <th class="th-name">Instrutor</th>
                  <th 
                    v-for="day in store.calendarDays.value" 
                    :key="day.key" 
                    :style="day.isWeekend ? weekendHeaderStyle : null"
                    :class="{ 'th-today': day.day === new Date().getDate() && store.state.calendarMonthIdx === new Date().getMonth() && store.state.calendarYear === new Date().getFullYear() }"
                  >
                    {{ day.day }}<br /><span class="day-label">{{ day.weekDay }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="base in ['SJK', 'CPQ']" :key="base">
                  <tr class="section-divider"><td :colspan="store.calendarDays.value.length + 1">✈ {{ base === 'SJK' ? 'SJK — São José dos Campos' : 'CPQ — Campinas' }}</td></tr>
                  
                  <tr v-for="row in (base === 'SJK' ? soloSJK : soloCPQ)" :key="row.id + '-' + base">
                    <td class="td-name" :class="base === 'SJK' ? 'solo-sjk' : 'solo-cpq'">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
                    <td v-for="day in row.days" :key="day.key" @click="openEditModal(row, day)">
                      <div class="day-cell-static clickable" :class="day.estado + (day.isToday ? ' today' : '')" :title="`${row.nome} — ${day.key}`">
                        <div class="day-sigla">{{ day.sigla }}</div>
                        <div v-if="day.periodo" class="day-periodo">{{ day.periodo }}</div>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="(base === 'SJK' ? soloSJK : soloCPQ).length === 0">
                    <td :colspan="store.calendarDays.value.length + 1" class="td-empty">Nenhum instrutor de solo encontrado para esta base.</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div class="cal-legend">
          <div class="cal-leg-group">
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#27ae60"></div> Ativo/Disponível (A/✓)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#c0392b"></div> Folga Regular (FR)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#e67e22"></div> Folga Social (FS)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#f1c40f"></div> Sobreaviso (SA)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#3498db"></div> Treinamento (TR)</div>
          </div>
          <div class="cal-leg-group">
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#9b59b6"></div> Férias (FE)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#1abc9c"></div> Banco de Horas (BH)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#34495e"></div> Operações (OP)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#7f8c8d"></div> Trabalho Externo (TE)</div>
            <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#000000"></div> Dispensa Médica (DM)</div>
          </div>
          <span class="cal-hint">Informações integradas da base de dados Safe TI · Clique em um dia para editar</span>
        </div>
      </div>

      <!-- Modal de Edição de Disponibilidade -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📅 Disponibilidade: {{ selectedInva?.nome }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-date-info"><strong>Data:</strong> {{ formattedModalDate }}</p>
            
            <div class="form-group">
              <label>Tipo de Disponibilidade:</label>
              <select v-model="formData.tipoId" class="modal-select">
                <option v-for="t in availTypes" :key="t.id" :value="t.id">{{ t.nome }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Período:</label>
              <select v-model="formData.periodo" class="modal-select">
                <option value="x">Integral</option>
                <option value="m">Manhã</option>
                <option value="t">Tarde</option>
                <option value="n">Noite</option>
              </select>
            </div>

            <div class="form-group">
              <label>Motivo / Observação:</label>
              <textarea v-model="formData.motivo" class="modal-textarea" placeholder="Opcional..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal-cancel" @click="closeModal">Cancelar</button>
            <button class="btn-modal-save" @click="handleSave" :disabled="isSaving">
              {{ isSaving ? 'Salvando...' : 'Salvar Alteração' }}
            </button>
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
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')
const weekendHeaderStyle = { background: '#34495e', color: '#fff' }

// Local computed properties for reliable reactivity
const flightSJK = computed(() => (store.calendarFlightRows.value || []).filter(r => r.base === 'SJK'))
const flightCPQ = computed(() => (store.calendarFlightRows.value || []).filter(r => r.base === 'CPQ'))
const soloSJK = computed(() => (store.calendarSoloRows.value || []).filter(r => r.base === 'SJK'))
const soloCPQ = computed(() => (store.calendarSoloRows.value || []).filter(r => r.base === 'CPQ'))

// Modal state
const isModalOpen = ref(false)
const isSaving = ref(false)
const selectedInva = ref(null)
const selectedDay = ref(null)
const formData = reactive({
  id: null,
  tipoId: 1,
  periodo: 'x',
  motivo: ''
})

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const availTypes = [
  { id: 1, nome: 'Disponivel' },
  { id: 2, nome: 'Folga Regular' },
  { id: 3, nome: 'Folga Social' },
  { id: 4, nome: 'Sobreaviso' },
  { id: 5, nome: 'Treinamento' },
  { id: 6, nome: 'Férias' },
  { id: 7, nome: 'Banco de Horas' },
  { id: 8, nome: 'Operações' },
  { id: 9, nome: 'Trabalho Externo' },
  { id: 10, nome: 'Dispensa Médica' },
  { id: 11, nome: 'Não Especificado' }
]

const formattedModalDate = computed(() => {
  if (!selectedDay.value) return ''
  const month = String(store.state.calendarMonthIdx + 1).padStart(2, '0')
  const day = String(selectedDay.value.key).padStart(2, '0')
  return `${day}/${month}/${store.state.calendarYear}`
})

function openEditModal(inva, day) {
  if (!inva || !day) return
  selectedInva.value = inva
  selectedDay.value = day
  
  // Look for existing record to populate form
  const dateParts = formattedModalDate.value.split('/')
  if (dateParts.length < 3) return
  const dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
  
  // Safely find the instructor in the store state
  const invasList = Array.isArray(store.state.INVAS) ? store.state.INVAS : []
  const realInva = invasList.find(i => i.id === inva.id)
  const existing = realInva?.escalas?.find(s => s.data && s.data.startsWith(dateStr))

  if (existing) {
    formData.id = existing.id
    formData.tipoId = existing.tipoDisponibilidadeId || existing.tipoDisponibilidade?.id || 1
    // Map existing record to form values: 'integral' or 'x' or 'i' all map to 'x'
    const p = String(existing.periodo || 'x').toLowerCase()
    formData.periodo = (p.startsWith('i') || p === 'x') ? 'x' : p.charAt(0)
    formData.motivo = existing.motivo || ''
  } else {
    formData.id = null
    formData.tipoId = 1
    formData.periodo = 'x'
    formData.motivo = ''
  }
  
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  selectedInva.value = null
  selectedDay.value = null
}

async function handleSave() {
  isSaving.value = true
  const dateParts = formattedModalDate.value.split('/')
  const payload = {
    data: `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
    invaId: selectedInva.value.id,
    tipoDisponibilidadeId: formData.tipoId,
    periodo: formData.periodo,
    motivo: formData.motivo
  }

  try {
    let res
    if (formData.id) {
      res = await store.updateAvailability(formData.id, payload)
    } else {
      res = await store.saveAvailability(payload)
    }

    if (res.success) {
      showToast('Disponibilidade salva com sucesso!', 'success')
      closeModal()
    } else {
      showToast(res.error || 'Erro ao salvar disponibilidade.', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao salvar.', 'danger')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  store.openCalendar()
})

function handleBackToEditor() {
  router.push('/editor')
}

function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f4f7f9;
}
.calendar-screen {
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}
.cal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  background: #1d2951;
  color: #fff;
  border-radius: 8px;
  padding: 12px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.cal-header h1 {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin: 0;
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.cal-month {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  min-width: 160px;
  text-align: center;
}
.btn-nav,
.btn-cal-back,
.btn-logout-cal {
  background: #1d2951;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-nav:hover { background: #162040; }
.btn-cal-back { background: #34495e; }
.btn-cal-back:hover { background: #2c3e50; }
.btn-logout-cal {
  background: #c0392b;
  border: none;
}
.btn-logout-cal:hover {
  background: #a93226;
}
.cal-body {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  padding: 20px;
  flex-grow: 1;
}
.calendar-section {
  margin-bottom: 40px;
}
.calendar-section h2 {
  font-size: 16px;
  font-weight: bold;
  color: #1d2951;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #eef2f5;
}
.table-wrapper {
  overflow-x: auto;
  border: 1px solid #eef2f5;
  border-radius: 6px;
}
.cal-table {
  width: 100%;
  border-collapse: collapse;
}
.cal-table th,
.cal-table td {
  border: 1px solid #eef2f5;
  padding: 4px;
  text-align: center;
  vertical-align: middle;
}
.cal-table th {
  font-size: 10px;
  padding: 8px 4px;
  background: #1d2951;
  color: #fff;
}
.cal-table th.th-name {
  text-align: left;
  padding-left: 15px;
  min-width: 180px;
  background: #1d2951;
  color: #fff;
  position: sticky;
  left: 0;
  z-index: 10;
  font-size: 12px;
}
.td-name {
  text-align: left;
  padding: 8px 15px;
  font-size: 11px;
  font-weight: bold;
  color: #333;
  background: #f8fafc;
  border-right: 2px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  left: 0;
  z-index: 5;
}
.td-name.solo-sjk { border-left: 4px solid #1d2951; }
.td-name.solo-cpq { border-left: 4px solid #1d6070; }
.day-cell-static {
  width: 50px;
  height: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #fff;
  gap: 2px;
  transition: transform 0.1s ease;
}
.day-cell-static.clickable { cursor: pointer; }
.day-cell-static.clickable:hover { transform: scale(1.05); filter: brightness(1.1); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

.day-sigla {
  font-size: 12px;
  font-weight: 800;
}
.day-periodo {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(0,0,0,0.15);
  padding: 1px 4px;
  border-radius: 3px;
  width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Colors for statuses */
.day-cell-static.avail,
.day-cell-static.weekend-avail { background: #27ae60; }
.day-cell-static.folga-reg { background: #c0392b; }
.day-cell-static.folga-soc { background: #e67e22; }
.day-cell-static.sobreaviso { background: #f1c40f; color: #000; }
.day-cell-static.treinamento { background: #3498db; }
.day-cell-static.ferias { background: #9b59b6; }
.day-cell-static.banco { background: #1abc9c; }
.day-cell-static.operacoes { background: #34495e; }
.day-cell-static.externo { background: #7f8c8d; }
.day-cell-static.medica { background: #000000; }
.day-cell-static.outro { background: #bdc3c7; color: #000; }
.day-cell-static.weekend { background: #f8fafc; color: #94a3b8; }
.day-cell-static.today { 
  outline: 3px solid #3b82f6; 
  outline-offset: -2px; 
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  position: relative;
  z-index: 2;
  animation: pulse-today 2s infinite;
}

@keyframes pulse-today {
  0% { box-shadow: 0 0 0px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.7); }
  100% { box-shadow: 0 0 0px rgba(59, 130, 246, 0.4); }
}

.th-today {
  background: #3b82f6 !important;
  color: #fff !important;
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 15;
}

.cal-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-top: 20px;
  flex-shrink: 0;
}
.cal-leg-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.cal-leg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  min-width: 140px;
}
.cal-leg-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
.cal-hint {
  margin-top: 5px;
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}
.day-label {
  font-size: 9px;
  font-weight: normal;
  display: block;
  margin-top: 1px;
  color: rgba(255, 255, 255, 0.7);
}
.section-divider td {
  background: #f1f5f9 !important;
  font-size: 11px;
  color: #475569;
  font-weight: 800;
  padding: 6px 15px !important;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.td-empty {
  padding: 20px !important;
  color: #94a3b8;
  font-style: italic;
  font-size: 12px;
  background: #fafbfc;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000; backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff; width: 100%; max-width: 450px;
  border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.modal-header {
  padding: 18px 22px; background: #f8f9fa; border-bottom: 1px solid #eee;
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h3 { margin: 0; font-size: 16px; color: #1d2951; }
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
  transition: all 0.2s ease;
}
.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1d2951;
}
.modal-body { padding: 22px; }
.modal-date-info { margin-bottom: 18px; font-size: 14px; color: #444; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #1d2951; }
.modal-select {
  width: 100%; height: 38px; border: 1px solid #ddd; border-radius: 8px;
  padding: 0 10px; font-size: 13px;
}
.modal-textarea {
  width: 100%; height: 80px; border: 1px solid #ddd; border-radius: 8px;
  padding: 10px; font-size: 13px; font-family: inherit; resize: none;
}
.modal-footer {
  padding: 16px 22px; border-top: 1px solid #eee;
  display: flex; justify-content: flex-end; gap: 10px;
}
.btn-modal-cancel { background: #eee; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-modal-save { background: #1d2951; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-modal-save:disabled { background: #999; cursor: default; }

/* Toast */
.toast-notification {
  position: fixed; top: 20px; right: 24px; padding: 10px 18px; border-radius: 10px;
  display: flex; align-items: center; gap: 10px; z-index: 6000;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.toast-success { background: #e6f7ed; border: 1px solid #27ae60; border-left: 5px solid #27ae60; }
.toast-danger { background: #fdf2f2; border: 1px solid #c0392b; border-left: 5px solid #c0392b; }
</style>
