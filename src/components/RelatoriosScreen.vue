<template>
  <div class="screen-layout">
    <div class="relatorios-screen">
      <div class="report-header">
        <div class="title-area">
          <h1>📊 Relatório de Horas &amp; Integração Cavok</h1>
          <p>Consulte as horas previstas, realizadas e sincronize os dados com o sistema Cavok</p>
        </div>
        <div class="header-actions">
          <button class="btn-back-nav" @click="router.push('/configuracoes')">← Voltar</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Coluna da Esquerda: Relatório de Horas por Instrutor -->
        <div class="dashboard-card main-card">
          <div class="card-header">
            <h3>📈 Saldo de Horas por Instrutor</h3>
            <div class="search-box">
              <input 
                type="text" 
                v-model="invaSearchQuery" 
                placeholder="🔍 Filtrar instrutor..." 
                class="search-input"
              />
            </div>
          </div>
          <div class="card-body scrollable-body">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Instrutor</th>
                  <th>Base</th>
                  <th class="text-right">Horas Reais (Cavok)</th>
                  <th class="text-right">Horas Agendadas (CCO)</th>
                  <th class="text-right">Total Previsto</th>
                  <th class="text-right">Total (Decimal)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredInvas.length === 0">
                  <td colspan="6" class="empty-row">Nenhum instrutor encontrado.</td>
                </tr>
                <tr v-for="inva in filteredInvas" :key="inva.id" class="report-row">
                  <td class="font-bold text-primary">{{ inva.nome }}</td>
                  <td>
                    <span class="badge-base" :class="inva.base?.nome?.toLowerCase() || 'default'">
                      {{ inva.base?.nome || inva.base || 'N/A' }}
                    </span>
                  </td>
                  <td class="text-right font-semibold text-success">
                    {{ formatMinutes(getInvaRealMinutes(inva.nome)) }}
                  </td>
                  <td class="text-right font-semibold text-secondary">
                    {{ formatMinutes(getInvaScheduledMinutes(inva.nome)) }}
                  </td>
                  <td class="text-right font-extrabold text-dark-primary">
                    {{ formatMinutes(getInvaRealMinutes(inva.nome) + getInvaScheduledMinutes(inva.nome)) }}
                  </td>
                  <td class="text-right font-bold text-primary">
                    {{ formatDecimalHours(getInvaRealMinutes(inva.nome) + getInvaScheduledMinutes(inva.nome)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Coluna da Direita: Sincronização Cavok -->
        <div class="dashboard-card side-card">
          <div class="card-header">
            <h3>⚡ Sincronizador Cavok</h3>
          </div>
          <div class="card-body">
            <div class="sync-controls">
              <div class="form-group">
                <label>Data de Voo:</label>
                <input type="date" v-model="syncDate" class="form-input date-input" />
              </div>
              <button 
                class="btn-sync-action" 
                @click="handleSyncCavok" 
                :disabled="isSyncing || !syncDate"
              >
                <span>{{ isSyncing ? 'Sincronizando...' : '🔄 Sincronizar com Cavok' }}</span>
              </button>
            </div>

            <div class="sync-flights-section">
              <h4 class="section-title">
                📋 Voos Sincronizados ({{ filteredVoosRealizados.length }})
              </h4>
              
              <div class="flights-list scrollable-flights">
                <div v-if="filteredVoosRealizados.length === 0" class="empty-flights">
                  Nenhum voo registrado para esta data no sistema. Clique em Sincronizar acima para buscar os registros.
                </div>
                <div v-for="voo in filteredVoosRealizados" :key="voo.id" class="flight-item-card">
                  <div class="flight-header">
                    <span class="flight-id">#{{ voo.cavokId || voo.id }}</span>
                    <span class="flight-time">{{ formatMinutes(voo.tempoTotalVoo) }}</span>
                  </div>
                  <div class="flight-body">
                    <div class="flight-line">
                      <strong>✈️ Aeronave:</strong> {{ voo.aeronave || 'N/A' }}
                    </div>
                    <div class="flight-line">
                      <strong>👨‍✈️ Inva:</strong> {{ voo.instrutor || 'N/A' }}
                    </div>
                    <div class="flight-line">
                      <strong>👨‍🎓 Aluno:</strong> {{ voo.aluno || 'N/A' }}
                    </div>
                    <div class="flight-line" v-if="voo.missao">
                      <strong>📋 Missão:</strong> {{ voo.missao }}
                    </div>
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const invaSearchQuery = ref('')
const isSyncing = ref(false)

const getTodayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const syncDate = ref(getTodayStr())
const voosRealizadosList = ref([])

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
      store.fetchSlots(),
      store.fetchBars(),
      loadVoosRealizados()
    ])
  } finally {
    store.state.globalLoading = false
  }
})

async function loadVoosRealizados() {
  try {
    const list = await store.fetchVoosRealizados()
    voosRealizadosList.value = list || []
  } catch (error) {
    console.error('Error loading voos realizados:', error)
  }
}

async function handleSyncCavok() {
  if (!syncDate.value) return
  isSyncing.value = true
  try {
    const res = await store.syncVoosRealizados(syncDate.value)
    if (res.success) {
      showToast('Sincronização com o Cavok concluída com sucesso!', 'success')
      await loadVoosRealizados()
    } else {
      showToast(res.error || 'Erro ao sincronizar com o Cavok', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao sincronizar.', 'danger')
  } finally {
    isSyncing.value = false
  }
}

const filteredInvas = computed(() => {
  const query = invaSearchQuery.value.toLowerCase().trim()
  const list = store.INVAS.value || []
  if (!query) return list
  return list.filter(i => (i.nome || '').toLowerCase().includes(query))
})

const filteredVoosRealizados = computed(() => {
  if (!syncDate.value) return voosRealizadosList.value
  return voosRealizadosList.value.filter(v => v.data === syncDate.value)
})

const formatMinutes = (totalMinutes) => {
  const mins = Math.round(parseFloat(totalMinutes) || 0)
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${String(remainingMins).padStart(2, '0')}m`
}

const formatDecimalHours = (totalMinutes) => {
  const hours = (parseFloat(totalMinutes) || 0) / 60
  return hours.toFixed(1).replace('.', ',') + 'h'
}

const getInvaRealMinutes = (invaName) => {
  if (!invaName) return 0
  const matchedVoos = voosRealizadosList.value.filter(voo => {
    const vInst = (voo.instrutor || '').toUpperCase().trim()
    const iName = invaName.toUpperCase().trim()
    return vInst && (iName.includes(vInst) || vInst.includes(iName))
  })
  return matchedVoos.reduce((sum, voo) => sum + (parseFloat(voo.tempoTotalVoo) || 0), 0)
}

const getInvaScheduledMinutes = (invaName) => {
  if (!invaName) return 0
  const now = new Date().getTime()
  const technicalImpediments = ['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE', 'CANCELADO']
  
  const slots = store.state.parsedSlots || []
  const matchedSlots = slots.filter(s => {
    const matchInva = s.inva && s.inva.toUpperCase().trim() === invaName.toUpperCase().trim()
    const hasStudent = !!s.aluno
    const isNotImpediment = s.st && !technicalImpediments.includes(s.st.toUpperCase().trim())
    
    let isFuture = true
    if (s.data && s.hora) {
      const [d, m, y] = s.data.split('/').map(Number)
      const [h, min] = s.hora.split(':').map(Number)
      const slotTime = new Date(y, m - 1, d, h, min).getTime()
      isFuture = slotTime >= now
    }
    
    return matchInva && hasStudent && isNotImpediment && isFuture
  })
  
  return matchedSlots.length * 90 // 1.5h = 90 minutes
}
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-main);
}

.relatorios-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary);
  color: #fff;
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-bottom: 4px solid var(--secondary);
}

.title-area h1 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
  font-family: var(--font-title);
  letter-spacing: 0.5px;
}

.title-area p {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.btn-back-nav {
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-nav:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

@media (max-width: 1000px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #dae2ec;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--primary);
  font-weight: 800;
  font-family: var(--font-title);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-box {
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--secondary);
  box-shadow: 0 0 0 3px rgba(var(--secondary-rgb), 0.1);
}

.scrollable-body {
  max-height: 700px;
  overflow-y: auto;
  padding: 0;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  padding: 12px 24px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.report-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.report-row:hover {
  background: #f8fafc;
}

.report-row:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right !important;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.font-extrabold {
  font-weight: 800;
}

.text-primary {
  color: var(--primary);
}

.text-success {
  color: #16a34a;
}

.text-secondary {
  color: var(--secondary);
}

.text-dark-primary {
  color: #0f172a;
}

.badge-base {
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.badge-base.sjk {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-base.cpq {
  background: #fef3c7;
  color: #b45309;
}

.badge-base.default {
  background: #f1f5f9;
  color: #475569;
}

.empty-row {
  text-align: center;
  padding: 32px !important;
  color: #94a3b8;
  font-style: italic;
}

/* Side Card: Sync */
.sync-controls {
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #fff;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: var(--secondary);
}

.btn-sync-action {
  width: 100%;
  padding: 12px;
  background: var(--secondary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-sync-action:hover:not(:disabled) {
  background: var(--primary);
  transform: translateY(-1px);
}

.btn-sync-action:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

.sync-flights-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scrollable-flights {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.scrollable-flights::-webkit-scrollbar {
  width: 5px;
}

.scrollable-flights::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 99px;
}

.empty-flights {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-style: italic;
  font-size: 12px;
  line-height: 1.5;
  border: 1.5px dashed #e2e8f0;
  border-radius: 10px;
}

.flight-item-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}

.flight-item-card:hover {
  border-color: var(--secondary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}

.flight-id {
  font-size: 11.5px;
  font-weight: 800;
  color: #64748b;
}

.flight-time {
  font-size: 11px;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  padding: 2px 8px;
  border-radius: 6px;
}

.flight-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #475569;
}

.flight-line strong {
  color: #1e293b;
}

.toast-notification {
  position: fixed;
  top: 20px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  z-index: 8000;
  display: flex;
  gap: 10px;
  align-items: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.toast-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-left: 6px solid #22c55e;
  color: #166534;
}

.toast-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 6px solid #ef4444;
  color: #991b1b;
}
</style>
