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
        <button class="btn-cal-back" @click="handleBackToEditor">Voltar</button>
        <button class="btn-logout-cal" @click="handleLogout">Sair</button>
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
                  <th v-for="day in store.calendarDays.value" :key="day.key" :style="day.isWeekend ? weekendHeaderStyle : null">
                    {{ day.day }}<br /><span class="day-label">{{ day.weekDay }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="base in ['SJK', 'CPQ']" :key="base">
                  <tr class="section-divider"><td :colspan="store.calendarDays.value.length + 1">✈ {{ base === 'SJK' ? 'SJK — São José dos Campos' : 'CPQ — Campinas' }}</td></tr>
                  
                  <tr v-for="row in (base === 'SJK' ? flightSJK : flightCPQ)" :key="row.nome">
                    <td class="td-name" :class="base === 'SJK' ? 'solo-sjk' : 'solo-cpq'">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
                    <td v-for="day in row.days" :key="day.key">
                      <div class="day-cell-static" :class="day.estado + (day.isToday ? ' today' : '')" :title="`${row.nome} — ${day.key}`">
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
                  <th v-for="day in store.calendarDays.value" :key="day.key" :style="day.isWeekend ? weekendHeaderStyle : null">
                    {{ day.day }}<br /><span class="day-label">{{ day.weekDay }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="base in ['SJK', 'CPQ']" :key="base">
                  <tr class="section-divider"><td :colspan="store.calendarDays.value.length + 1">✈ {{ base === 'SJK' ? 'SJK — São José dos Campos' : 'CPQ — Campinas' }}</td></tr>
                  
                  <tr v-for="row in (base === 'SJK' ? soloSJK : soloCPQ)" :key="row.nome">
                    <td class="td-name" :class="base === 'SJK' ? 'solo-sjk' : 'solo-cpq'">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
                    <td v-for="day in row.days" :key="day.key">
                      <div class="day-cell-static" :class="day.estado + (day.isToday ? ' today' : '')" :title="`${row.nome} — ${day.key}`">
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
          <span class="cal-hint">Informações integradas da base de dados Safe TI</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')
const weekendHeaderStyle = { background: '#34495e', color: '#fff' }

// Local computed properties for reliable reactivity
const flightSJK = computed(() => (store.calendarFlightRows.value || []).filter(r => r.base === 'SJK'))
const flightCPQ = computed(() => (store.calendarFlightRows.value || []).filter(r => r.base === 'CPQ'))
const soloSJK = computed(() => (store.calendarSoloRows.value || []).filter(r => r.base === 'SJK'))
const soloCPQ = computed(() => (store.calendarSoloRows.value || []).filter(r => r.base === 'CPQ'))

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
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-nav:hover { background: #162040; }
.btn-cal-back { background: #6c757d; }
.btn-cal-back:hover { background: #5a6268; }
.btn-logout-cal {
  background: #c0392b;
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
}

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
.day-cell-static.today { outline: 2px solid #3b82f6; outline-offset: -2px; }

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
</style>
