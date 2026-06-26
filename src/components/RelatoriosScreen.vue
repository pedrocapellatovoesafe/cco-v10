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
        <!-- Coluna da Esquerda: Gráfico + Saldo de Horas -->
        <div class="main-column">
          
          <!-- Card do Gráfico de Linha -->
          <div class="dashboard-card chart-container-card">
            <div class="card-header">
              <h3>📈 Horas Voadas e Previstas por Inva</h3>
              <div class="chart-filters">
                <div class="filter-item">
                  <label>Mês:</label>
                  <select v-model="chartMonth" class="chart-select">
                    <option v-for="m in uniqueMonths" :key="m" :value="m">
                      {{ formatMonthStr(m) }}
                    </option>
                  </select>
                </div>
                <div class="filter-item">
                  <label>Status:</label>
                  <select v-model="chartInvaStatus" class="chart-select">
                    <option value="all">Todos os Status</option>
                    <option v-for="sit in chartAvailableSituacoes" :key="sit.id" :value="sit.id">
                      {{ getSitLabel(sit.nome) }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="card-body chart-body-wrapper">
              <div v-if="chartData.length === 0" class="empty-chart-state">
                Nenhum instrutor encontrado para os filtros selecionados.
              </div>
              <div v-else class="svg-chart-container">
                <!-- SVG Line Chart -->
                <svg viewBox="0 0 800 350" class="svg-line-chart">
                  <!-- Definitions for Gradients -->
                  <defs>
                    <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#22c55e" stop-opacity="0.15"/>
                      <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
                      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                    </linearGradient>
                  </defs>

                  <!-- Horizontal Grid Lines -->
                  <line 
                    v-for="tick in gridTicks" 
                    :key="tick" 
                    x1="50" 
                    :y1="getTickY(tick)" 
                    x2="780" 
                    :y2="getTickY(tick)" 
                    class="chart-grid-line"
                  />

                  <!-- Grid Labels (Y Axis) -->
                  <text 
                    v-for="tick in gridTicks" 
                    :key="tick" 
                    x="40" 
                    :y="getTickY(tick) + 4" 
                    class="chart-axis-label-y"
                  >
                    {{ tick }}h
                  </text>

                  <!-- Area under Lines (Gradients) -->
                  <path :d="realAreaPath" fill="url(#realGradient)" />
                  <path :d="totalAreaPath" fill="url(#totalGradient)" />

                  <!-- Main Lines -->
                  <path :d="realLinePath" class="chart-line real-line" />
                  <path :d="totalLinePath" class="chart-line total-line" />

                  <!-- Interactivity Dots & Tooltip Triggers -->
                  <g v-for="(pt, idx) in chartPoints" :key="idx">
                    <!-- Vertical hover helper line -->
                    <line 
                      v-if="hoveredIdx === idx"
                      :x1="pt.x" 
                      y1="20" 
                      :x2="pt.x" 
                      y2="210" 
                      class="chart-hover-line"
                    />

                    <!-- Real Hours Dots -->
                    <circle 
                      :cx="pt.x" 
                      :cy="pt.yReal" 
                      r="4" 
                      class="chart-dot dot-real"
                      @mouseenter="setHoveredPoint(pt, idx, $event)"
                      @mouseleave="clearHoveredPoint"
                    />
                    
                    <!-- Total Hours Dots -->
                    <circle 
                      :cx="pt.x" 
                      :cy="pt.yTotal" 
                      r="4" 
                      class="chart-dot dot-total"
                      @mouseenter="setHoveredPoint(pt, idx, $event)"
                      @mouseleave="clearHoveredPoint"
                    />

                    <!-- X Axis Labels (Instructor names) -->
                    <text 
                      :x="pt.x" 
                      y="225" 
                      :transform="`rotate(90, ${pt.x}, 225)`"
                      class="chart-axis-label-x vertical-label"
                    >
                      {{ pt.name.length > 23 ? pt.name.substring(0, 23) + '...' : pt.name }}
                    </text>
                  </g>
                </svg>

                <!-- Absolute HTML Tooltip -->
                <div 
                  v-if="hoveredPoint" 
                  class="chart-tooltip" 
                  :style="{ left: hoveredPoint.tooltipX + 'px', top: hoveredPoint.tooltipY + 'px' }"
                >
                  <div class="tooltip-title">{{ hoveredPoint.name }}</div>
                  <div class="tooltip-row">
                    <span class="dot-indicator green"></span>
                    <span>Voadas: <strong>{{ hoveredPoint.real.toFixed(1) }}h</strong></span>
                  </div>
                  <div class="tooltip-row">
                    <span class="dot-indicator blue"></span>
                    <span>Previstas: <strong>{{ hoveredPoint.total.toFixed(1) }}h</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="chart-legend" v-if="chartData.length > 0">
              <div class="legend-item">
                <span class="legend-color real-color"></span>
                <span>Horas Voadas (Real Cavok)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color total-color"></span>
                <span>Horas Previstas (Real + CCO)</span>
              </div>
            </div>
          </div>

          <!-- Card da Tabela -->
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
        </div> <!-- Fim main-column -->

        <!-- Coluna da Direita: Sincronização Cavok -->
        <div class="dashboard-card side-card">
          <div class="card-header">
            <h3>⚡ Sincronizador Cavok</h3>
          </div>
          <div class="card-body">
            <div class="sync-controls">
              <div class="date-range-group">
                <div class="form-group">
                  <label>Data Inicial:</label>
                  <input type="date" v-model="syncStartDate" class="form-input date-input" />
                </div>
                <div class="form-group">
                  <label>Data Final:</label>
                  <input type="date" v-model="syncEndDate" class="form-input date-input" />
                </div>
              </div>
              <button 
                class="btn-sync-action" 
                @click="handleSyncCavok" 
                :disabled="isSyncing || !syncStartDate || !syncEndDate"
              >
                <span>{{ isSyncing ? 'Sincronizando...' : '🔄 Sincronizar com Cavok' }}</span>
              </button>

              <!-- Resumo da última sincronização -->
              <div v-if="lastSyncSummary" class="last-sync-summary-box">
                <div class="summary-box-header">
                  <strong>Resumo da Sincronização:</strong>
                  <button class="btn-close-summary" @click="lastSyncSummary = null">×</button>
                </div>
                <p class="summary-box-info">
                  Dias: <strong>{{ lastSyncSummary.totalDays }}</strong> | Sincronizados: <strong>{{ lastSyncSummary.totalSyncedCount }} voos</strong>
                </p>
                <div class="summary-days-list">
                  <div 
                    v-for="day in lastSyncSummary.summary" 
                    :key="day.date" 
                    class="summary-day-item"
                    :class="day.status"
                  >
                    <span class="day-date">{{ formatDateStr(day.date) }}</span>
                    <span class="day-badge" :class="day.status">
                      {{ day.count }} {{ day.count === 1 ? 'voo' : 'voos' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sync-flights-section">
              <h4 class="section-title">
                📋 Voos Sincronizados ({{ filteredVoosRealizados.length }})
              </h4>
              
              <!-- Filtros da lista de voos -->
              <div class="list-filters-box">
                <div class="filter-row">
                  <div class="filter-group">
                    <label>Início:</label>
                    <input type="date" v-model="filterStartDate" class="filter-input" />
                  </div>
                  <div class="filter-group">
                    <label>Fim:</label>
                    <input type="date" v-model="filterEndDate" class="filter-input" />
                  </div>
                </div>
                <div class="filter-group mt-2">
                  <label>Instrutor:</label>
                  <input 
                    type="text" 
                    v-model="filterInstructor" 
                    placeholder="Filtrar por nome do instrutor..." 
                    class="filter-input" 
                  />
                </div>
              </div>
              
              <div class="flights-list scrollable-flights">
                <div v-if="filteredVoosRealizados.length === 0" class="empty-flights">
                  Nenhum voo registrado para os filtros selecionados no sistema. Clique em Sincronizar acima para buscar os registros.
                </div>
                <div v-for="voo in filteredVoosRealizados" :key="voo.id" class="flight-item-card">
                  <div class="flight-header">
                    <span class="flight-id">#{{ voo.cavokId || voo.id }}</span>
                    <span class="flight-time">{{ formatMinutes(voo.tempoTotalVoo) }}</span>
                  </div>
                  <div class="flight-body">
                    <div class="flight-line">
                      <strong>✈️ Aeronave:</strong> {{ voo.aeronaveRelation?.nome || voo.aeronave || 'N/A' }}
                    </div>
                    <div class="flight-line">
                      <strong>👨‍✈️ Inva:</strong> {{ voo.invaRelation?.nome || voo.instrutor || 'N/A' }}
                    </div>
                    <div class="flight-line">
                      <strong>👨‍🎓 Aluno:</strong> {{ voo.alunoRelation?.nome || voo.aluno || 'N/A' }}
                    </div>
                    <div class="flight-line" v-if="voo.missaoRelation?.nome || voo.missao">
                      <strong>📋 Missão:</strong> {{ voo.missaoRelation?.nome || voo.missao }}
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

const getFirstDayOfMonthStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

const syncStartDate = ref(getFirstDayOfMonthStr())
const syncEndDate = ref(getTodayStr())
const lastSyncSummary = ref(null)
const voosRealizadosList = ref([])

// Filtros da lista
const filterStartDate = ref(getTodayStr())
const filterEndDate = ref(getTodayStr())
const filterInstructor = ref('')

// Filtros do gráfico
const chartMonth = ref(getTodayStr().substring(0, 7)) // e.g. "2026-06"
const chartInvaStatus = ref('all')

const uniqueMonths = computed(() => {
  const months = new Set()
  
  // Voos realizados
  voosRealizadosList.value.forEach(v => {
    if (v.data && v.data.length >= 7) {
      months.add(v.data.substring(0, 7))
    }
  })
  
  // Slots
  const slots = store.state.parsedSlots || []
  slots.forEach(s => {
    if (s.data) {
      const parts = s.data.split('/')
      if (parts.length === 3) {
        const y = parts[2]
        const m = String(parts[1]).padStart(2, '0')
        months.add(`${y}-${m}`)
      }
    }
  })
  
  if (months.size === 0) {
    months.add(getTodayStr().substring(0, 7))
  }
  
  return Array.from(months).sort().reverse()
})

const formatMonthStr = (mStr) => {
  if (!mStr) return ''
  const [year, month] = mStr.split('-')
  const monthsBR = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const idx = parseInt(month, 10) - 1
  return `${monthsBR[idx]} de ${year}`
}

const isSoloOrChecadorInva = (inva) => {
  if (!inva) return false
  
  // 1. Check direct relation name
  const sitName = (
    inva.situacao?.nome || 
    inva.situacaoInva?.nome || 
    inva.situacao_inva?.nome || 
    (typeof inva.situacao === 'string' ? inva.situacao : '')
  ).toLowerCase().trim()
  
  if (sitName === 'solo' || sitName === 'checador') return true
  
  // 2. Fallback: look up in store.SITUACOES by any possible ID key
  const sitId = inva.situacaoInvaId || 
                inva.situacao_inva_id || 
                inva.situacao?.id || 
                inva.situacaoInva?.id || 
                inva.situacao_inva?.id
                
  if (sitId && store.SITUACOES.value && store.SITUACOES.value.length > 0) {
    const sit = store.SITUACOES.value.find(s => s.id === sitId)
    if (sit) {
      const dbSitName = (sit.nome || '').toLowerCase().trim()
      if (dbSitName === 'solo' || dbSitName === 'checador') {
        return true
      }
    }
  }
  
  return false
}

const chartAvailableSituacoes = computed(() => {
  const list = store.SITUACOES.value || []
  return list.filter(s => {
    const name = (s.nome || '').toLowerCase().trim()
    return name !== 'solo' && name !== 'checador'
  })
})

const chartFilteredInvas = computed(() => {
  let list = store.INVAS.value || []
  list = list.filter(i => !isSoloOrChecadorInva(i))
  if (chartInvaStatus.value !== 'all') {
    list = list.filter(i => {
      const sitId = i.situacaoInvaId || i.situacao_inva_id || i.situacaoInva?.id || i.situacao?.id
      return String(sitId) === String(chartInvaStatus.value)
    })
  }
  return list
})

const getInvaRealMinutesForMonth = (invaName, monthStr) => {
  if (!invaName) return 0
  const matchedVoos = voosRealizadosList.value.filter(voo => {
    const vInst = (voo.invaRelation?.nome || voo.instrutor || '').toUpperCase().trim()
    const iName = invaName.toUpperCase().trim()
    const matchName = vInst && (iName.includes(vInst) || vInst.includes(iName))
    const vooDate = voo.data ? voo.data.substring(0, 10) : ''
    const matchMonth = !monthStr || vooDate.startsWith(monthStr)
    return matchName && matchMonth
  })
  return matchedVoos.reduce((sum, voo) => sum + (parseFloat(voo.tempoTotalVoo) || 0), 0)
}

const getInvaScheduledMinutesForMonth = (invaName, monthStr) => {
  if (!invaName) return 0
  const technicalImpediments = ['REVISÃO', 'OPERAÇÕES', 'METEOROLOGIA', 'MANUTENÇÃO', 'INDISPONIBILIDADE', 'CANCELADO']
  
  let targetYear = null
  let targetMonth = null
  if (monthStr) {
    const [y, m] = monthStr.split('-').map(Number)
    targetYear = y
    targetMonth = m
  }
  
  const slots = store.state.parsedSlots || []
  const matchedSlots = slots.filter(s => {
    const matchInva = s.inva && s.inva.toUpperCase().trim() === invaName.toUpperCase().trim()
    const hasStudent = !!s.aluno
    const isNotImpediment = s.st && !technicalImpediments.includes(s.st.toUpperCase().trim())
    
    let matchMonth = true
    if (monthStr && s.data) {
      const [d, m, y] = s.data.split('/').map(Number)
      matchMonth = (y === targetYear && m === targetMonth)
    }
    
    return matchInva && hasStudent && isNotImpediment && matchMonth
  })
  
  return matchedSlots.length * 90 // 1.5h = 90 mins
}

const chartData = computed(() => {
  const invasList = chartFilteredInvas.value
  return invasList.map(inva => {
    const real = getInvaRealMinutesForMonth(inva.nome, chartMonth.value) / 60
    const scheduled = getInvaScheduledMinutesForMonth(inva.nome, chartMonth.value) / 60
    const total = real + scheduled
    return {
      name: inva.nome,
      real,
      total
    }
  })
})

const maxHours = computed(() => {
  const vals = chartData.value.map(d => d.total)
  const maxVal = vals.length > 0 ? Math.max(...vals, 10) : 10
  return Math.ceil(maxVal / 10) * 10
})

const gridTicks = computed(() => {
  const max = maxHours.value
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max]
})

const getTickY = (tick) => {
  const max = maxHours.value
  return 210 - (tick / max) * 190
}

const chartPoints = computed(() => {
  const data = chartData.value
  const max = maxHours.value
  if (data.length === 0) return []
  
  return data.map((d, i) => {
    const x = 50 + (data.length > 1 ? i * (730 / (data.length - 1)) : 365)
    const yReal = 210 - (d.real / max) * 190
    const yTotal = 210 - (d.total / max) * 190
    return {
      x,
      yReal,
      yTotal,
      name: d.name,
      real: d.real,
      total: d.total
    }
  })
})

const realLinePath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  return `M ${points.map(p => `${p.x},${p.yReal}`).join(' L ')}`
})

const totalLinePath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  return `M ${points.map(p => `${p.x},${p.yTotal}`).join(' L ')}`
})

const realAreaPath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  const linePoints = points.map(p => `${p.x},${p.yReal}`).join(' L ')
  return `M ${first.x},210 L ${linePoints} L ${last.x},210 Z`
})

const totalAreaPath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  const linePoints = points.map(p => `${p.x},${p.yTotal}`).join(' L ')
  return `M ${first.x},210 L ${linePoints} L ${last.x},210 Z`
})

const hoveredIdx = ref(null)
const hoveredPoint = ref(null)

const setHoveredPoint = (pt, idx, event) => {
  hoveredIdx.value = idx
  const container = event.target.closest('.svg-chart-container')
  if (!container) return
  
  // Limita o tooltipX para não estourar as bordas esquerda/direita do container
  let tooltipX = pt.x - 65
  if (tooltipX < 10) {
    tooltipX = 10
  } else if (tooltipX + 140 > 790) {
    tooltipX = 790 - 140
  }

  hoveredPoint.value = {
    ...pt,
    tooltipX,
    tooltipY: Math.min(pt.yReal, pt.yTotal) - 85
  }
}

const clearHoveredPoint = () => {
  hoveredIdx.value = null
  hoveredPoint.value = null
}

const truncateName = (name) => {
  if (!name) return ''
  const parts = name.split(' ')
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1].substring(0, 1)}.`
  }
  return name.substring(0, 10)
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
      store.fetchSlots(),
      store.fetchBars(),
      store.fetchSituacoes(),
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
  if (!syncStartDate.value || !syncEndDate.value) return
  isSyncing.value = true
  lastSyncSummary.value = null
  try {
    const res = await store.syncVoosRealizados(syncStartDate.value, syncEndDate.value)
    if (res.success) {
      const data = res.data || {}
      lastSyncSummary.value = data
      
      let msg = 'Sincronização com o Cavok concluída com sucesso!'
      if (typeof data.totalSyncedCount !== 'undefined') {
        msg = `Sincronização concluída: ${data.totalSyncedCount} voos em ${data.totalDays || 1} dia(s).`
      }
      showToast(msg, 'success')
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
  let list = store.INVAS.value || []
  list = list.filter(i => !isSoloOrChecadorInva(i))
  if (!query) return list
  return list.filter(i => (i.nome || '').toLowerCase().includes(query))
})

const filteredVoosRealizados = computed(() => {
  return voosRealizadosList.value.filter(v => {
    const vooDate = v.data ? v.data.substring(0, 10) : ''
    if (filterStartDate.value && vooDate < filterStartDate.value) return false
    if (filterEndDate.value && vooDate > filterEndDate.value) return false
    if (filterInstructor.value) {
      const vInst = (v.invaRelation?.nome || v.instrutor || '').toUpperCase().trim()
      const search = filterInstructor.value.toUpperCase().trim()
      if (!vInst.includes(search)) return false
    }
    return true
  })
})

const formatDateStr = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

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

const getSitLabel = (nome) => {
  if (!nome) return 'Sem Situação'
  const labels = {
    'clt_full': 'Clt Full-time',
    'clt_part': 'Clt Part-time',
    'solo': 'Solo',
    'eventual': 'Eventual',
    'checador': 'Checador'
  }
  return labels[nome.toLowerCase().trim()] || nome
}

const getInvaRealMinutes = (invaName) => {
  if (!invaName) return 0
  const matchedVoos = voosRealizadosList.value.filter(voo => {
    const vInst = (voo.invaRelation?.nome || voo.instrutor || '').toUpperCase().trim()
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

.date-range-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.last-sync-summary-box {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close-summary {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
}

.btn-close-summary:hover {
  color: #0f172a;
}

.summary-box-info {
  margin: 0;
  color: #475569;
}

.summary-days-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 4px;
}

.summary-day-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.summary-day-item.success {
  border-left: 3px solid #22c55e;
}

.summary-day-item.failure {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

.day-date {
  font-weight: 600;
  color: #334155;
}

.day-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.day-badge.success {
  background: #dcfce7;
  color: #15803d;
}

.day-badge.failure {
  background: #fef2f2;
  color: #991b1b;
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

.list-filters-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.filter-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12.5px;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: var(--secondary);
}

.mt-2 {
  margin-top: 8px;
}

/* Gráfico de Linha Styles */
.main-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-container-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #dae2ec;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  position: relative;
  z-index: 10;
  overflow: visible !important;
}

.chart-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-item label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.chart-select {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
  outline: none;
  background: #fff;
  transition: all 0.2s;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}

.chart-select:focus {
  border-color: var(--secondary);
}

.chart-body-wrapper {
  padding: 20px 24px;
  position: relative;
  min-height: 250px;
}

.empty-chart-state {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

.svg-chart-container {
  width: 100%;
  position: relative;
}

.svg-line-chart {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-grid-line {
  stroke: #f1f5f9;
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}

.chart-axis-label-y {
  fill: #94a3b8;
  font-size: 10px;
  text-anchor: end;
  font-weight: 600;
  font-family: inherit;
}

.chart-axis-label-x {
  fill: #64748b;
  font-size: 9.5px;
  text-anchor: middle;
  font-weight: 700;
  font-family: inherit;
}

.chart-axis-label-x.vertical-label {
  text-anchor: start;
  dominant-baseline: middle;
}

.chart-line {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.3s ease;
}

.real-line {
  stroke: #22c55e;
}

.total-line {
  stroke: #3b82f6;
}

.chart-hover-line {
  stroke: #e2e8f0;
  stroke-width: 1.5;
  stroke-dasharray: 2 2;
  pointer-events: none;
}

.chart-dot {
  stroke-width: 2.5;
  cursor: pointer;
  transition: r 0.2s ease, stroke-width 0.2s ease;
}

.chart-dot:hover {
  r: 7;
  stroke-width: 4.5;
}

.dot-real {
  fill: #fff;
  stroke: #22c55e;
}

.dot-total {
  fill: #fff;
  stroke: #3b82f6;
}

.chart-tooltip {
  position: absolute;
  background: rgba(15, 23, 42, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
  font-size: 11.5px;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 135px;
  transition: all 0.08s ease-out;
}

.tooltip-title {
  font-weight: 800;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 4px;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-indicator.green {
  background: #22c55e;
}

.dot-indicator.blue {
  background: #3b82f6;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px 24px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.real-color {
  background: #22c55e;
}

.legend-color.total-color {
  background: #3b82f6;
}
</style>
