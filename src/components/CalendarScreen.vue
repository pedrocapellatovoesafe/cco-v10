<template>
  <div id="cal-screen" class="calendar-screen">
    <div class="cal-header">
      <h1>📅 Disponibilidade Mensal — Instrutores de Solo</h1>
      <div class="cal-nav">
        <button class="btn-nav" @click="store.changeCalendarMonth(-1)">◀</button>
        <div class="cal-month">{{ store.calendarMonthLabel }}</div>
        <button class="btn-nav" @click="store.changeCalendarMonth(1)">▶</button>
      </div>
      <button class="btn-cal-save" @click="store.saveCalendarStorage">💾 Salvar</button>
      <span class="cal-saved">✓ Salvo!</span>
      <button class="btn-cal-back" @click="handleBackToUpload">← Voltar</button>
    </div>

    <div class="cal-body">
      <div class="table-wrapper">
        <table class="cal-table">
          <thead>
            <tr>
              <th class="th-name">Instrutor</th>
              <th v-for="day in store.calendarDays" :key="day.key" :style="day.isWeekend ? weekendHeaderStyle : null">
                {{ day.day }}<br /><span class="day-label">{{ day.weekDay }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-divider-sjk"><td :colspan="store.calendarDays.length + 1">✈ SJK — São José dos Campos</td></tr>
            <tr v-for="row in store.calendarRows.filter(r => r.base === 'SJK')" :key="row.nome">
              <td class="td-name solo-sjk">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
              <td v-for="day in row.days" :key="day.key">
                <button class="day-cell" :class="day.estado + (day.isToday ? ' today' : '')" @click="store.toggleCalendarDay(day.key, day.isWeekend)" :title="`${row.nome} — ${day.key}`">
                  {{ day.label }}
                </button>
              </td>
            </tr>
            <tr class="section-divider"><td :colspan="store.calendarDays.length + 1">✈ CPQ — Campinas</td></tr>
            <tr v-for="row in store.calendarRows.filter(r => r.base === 'CPQ')" :key="row.nome">
              <td class="td-name solo-cpq">{{ row.nome.split(' ').slice(0, 2).join(' ') }}</td>
              <td v-for="day in row.days" :key="day.key">
                <button class="day-cell" :class="day.estado + (day.isToday ? ' today' : '')" @click="store.toggleCalendarDay(day.key, day.isWeekend)" :title="`${row.nome} — ${day.key}`">
                  {{ day.label }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="cal-legend">
        <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#27ae60"></div> Disponível</div>
        <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#c0392b"></div> Folga/Indisponível</div>
        <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#f39c12"></div> Condicional (CCO confirma)</div>
        <div class="cal-leg-item"><div class="cal-leg-dot" style="background:#f8f8f8;border:1px solid #ddd"></div> Sem voo (fora do período)</div>
        <span class="cal-hint">Clique em cada dia para alternar o status · Dados salvos automaticamente no navegador</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')
const weekendHeaderStyle = { background: '#3a5068', opacity: '0.7' }

function handleBackToUpload() {
  store.closeCalendar()
  router.push('/upload')
}
</script>

<style scoped>
.calendar-screen {
  width: 100%;
}
.cal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  flex-wrap: wrap;
}
.cal-header h1 {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin: 0;
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.cal-month {
  font-size: 14px;
  font-weight: bold;
  color: #1d2951;
  min-width: 140px;
  text-align: center;
}
.btn-nav,
.btn-cal-save,
.btn-cal-back {
  background: #1d2951;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.btn-nav:hover { background: #162040; }
.btn-cal-save { background: #27ae60; }
.btn-cal-save:hover { background: #1e8449; }
.btn-cal-back { background: #888; }
.btn-cal-back:hover { background: #666; }
.cal-saved {
  font-size: 11px;
  color: #155724;
  background: #d4edda;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
}
.cal-body {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}
.table-wrapper {
  overflow-x: auto;
}
.cal-table {
  width: 100%;
  border-collapse: collapse;
}
.cal-table th,
.cal-table td {
  border: 1px solid #e0e0e0;
  padding: 6px 8px;
  text-align: center;
  vertical-align: middle;
  font-size: 11px;
}
.cal-table th.th-name {
  text-align: left;
  padding-left: 12px;
  min-width: 160px;
  background: #162040;
  color: #fff;
}
.td-name {
  text-align: left;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: bold;
  color: #333;
  background: #f8f8f8;
  border-right: 2px solid #ccc;
  white-space: nowrap;
}
.td-name.solo-sjk { border-left: 3px solid #1d2951; }
.td-name.solo-cpq { border-left: 3px solid #1d6070; }
.day-cell {
  width: 100%;
  height: 32px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  transition: background 0.1s;
}
.day-cell.avail { background: #27ae60; color: #fff; }
.day-cell.folga { background: #c0392b; color: #fff; }
.day-cell.cond { background: #f39c12; color: #fff; }
.day-cell.weekend { background: #f0f0f0; color: #aaa; }
.day-cell.today { outline: 2px solid #5baee2; outline-offset: -2px; }
.cal-legend {
  display: flex;
  gap: 16px;
  padding: 10px 14px;
  font-size: 11px;
  background: #f8f8f8;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
}
.cal-leg-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cal-leg-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.cal-hint {
  margin-left: auto;
  font-size: 10px;
  color: #999;
}
.day-label {
  font-size: 9px;
  font-weight: normal;
}
.section-divider-sjk td,
.section-divider td { background: #e8f4f8 !important; font-size: 10px; color: #1d6070; font-weight: bold; padding: 3px 12px !important; border: none !important; }
</style>
