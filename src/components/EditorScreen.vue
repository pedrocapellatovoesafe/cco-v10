<template>
  <div id="editor-screen" class="editor-screen">
    <div class="topbar">
      <img :src="iconUrl" alt="SAFE" style="width:28px;height:28px;border-radius:50%;opacity:.85;" />
      <h1>{{ store.editorTitle }}</h1>
      <div class="controls">
        <div class="score-box">🟢 <span class="score-num sg">{{ store.scoreOk }}</span> &nbsp;|&nbsp; 🔴 <span class="score-num sr">{{ store.scoreErr }}</span></div>
        <button class="btn-auto" @click="store.smartShuffle">⚡ Auto-resolver</button>
        <button class="btn-reset" @click="store.resetSchedule">↺ Reset</button>
        <button class="btn-back" @click="() => router.push('/upload')">📂 Nova escala</button>
      </div>
    </div>

    <div class="shuffle-log" v-if="store.shuffleLog">{{ store.shuffleLog }}</div>
    <div class="alert-panel">
      <div class="alert-line al-ok" v-if="!alertList.length">✅ Escala 100% verde — nenhum problema!</div>
      <div class="alert-line al-err" v-for="alert in alertList" :key="alert.msg">{{ alert.msg }}</div>
    </div>

    <div class="panels">
      <div class="panel-box" style="flex:2;"><h3>Jornada ao vivo</h3><div class="jornada-panel">
        <div v-if="jornadaRows.length === 0" class="empty-message">Nenhum escalado.</div>
        <div v-for="row in jornadaRows" :key="row.instr" class="j-row">
          <div class="j-name">{{ row.instr }}</div>
          <div class="j-slots">{{ row.times }}</div>
          <div class="j-bar"><div class="j-fill" :class="row.barClass" :style="{ width: row.fill + '%' }"></div></div>
          <div class="j-h" :class="{ 'jerr-t': row.fill > 100 }">{{ row.duration }}h</div>
        </div>
      </div></div>

      <div class="panel-box"><h3>Disponibilidade</h3><div class="disp-panel">
        <div class="disp-group" v-for="base in ['SJK', 'CPQ']" :key="base">
          <div class="disp-group-label">{{ base }}</div>
          <div class="disp-chips">
            <span
              v-for="instr in store.availabilityGroups[base].voo"
              :key="instr.nome"
              class="ic"
              :class="store.availabilityClass(instr.nome)"
              @click="store.toggleDisp(instr.nome)"
              :title="instr.nome"
            >
              {{ instr.nome.split(' ')[0] }}
            </span>
          </div>
        </div>
      </div></div>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', store.activeTab === 'SJK' ? 't-sjk' : '']" @click="store.activeTab = 'SJK'">✈ SJK <span class="tscore">{{ store.scoreSjk }}</span></button>
      <button :class="['tab-btn', store.activeTab === 'CPQ' ? 't-cpq' : '']" @click="store.activeTab = 'CPQ'">✈ CPQ <span class="tscore">{{ store.scoreCpq }}</span></button>
    </div>

    <div class="tab-panel active">
      <div v-for="block in store.scheduleBlocks[store.activeTab]" :key="block.id" class="barra-bloco">
        <div class="bh" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
          <div class="hd"><div class="d1">{{ store.parsedDate }}</div><div class="d2">{{ store.parsedDayName }}</div></div>
          <div v-for="slot in block.slots" :key="slot.id" class="hh" draggable="true"
            @dragstart="onDragStart(slot.id)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(slot.id)"
            @dragleave="onDragLeave(slot.id)"
            @drop.prevent="onDropSlot(slot.id)"
          >
            {{ slot.hora }} <span v-if="!slot.anac" class="drag-indicator">⠿</span>
          </div>
        </div>

        <div class="barra-body">
          <div class="brow" v-for="label in rowLabels" :key="label" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
            <div class="rl">{{ label }}</div>
            <template v-for="slot in block.slots" :key="slot.id + label">
              <div v-if="label === 'Aluno'" class="sc" :class="slot.aluno ? '' : 'sc-empty'"><div class="sv">{{ slot.aluno }}</div></div>
              <div v-else-if="label === 'Instrutor'" :class="slotCellClass(slot)">
                <template v-if="slot.anac"><div class="sv locked">🔒 {{ slot.inva }}</div></template>
                <template v-else>
                  <select v-model="slot.inva" @change="onInstructorChange(slot.id, slot.inva)">
                    <option value="">—</option>
                    <optgroup label="Autorizados">
                      <option v-for="name in instructorOptions(slot, true)" :key="name" :value="name">{{ name }}</option>
                    </optgroup>
                    <optgroup label="Não autorizados" v-if="instructorOptions(slot, false).length">
                      <option v-for="name in instructorOptions(slot, false)" :key="name" :value="name">{{ name }}</option>
                    </optgroup>
                  </select>
                </template>
              </div>
              <div v-else-if="label === 'AE'" class="sc"><div class="sv">{{ block.ae }}</div></div>
              <div v-else-if="label === 'Missão'" class="sc" :class="slot.missao ? '' : 'sc-empty'"><div class="sv">{{ slot.missao }}</div></div>
              <div v-else-if="label === 'Status'" class="sc">
                <template v-if="slot.aluno && !slot.anac">
                  <select v-model="slot.st" @change="onStatusChange(slot.id, slot.st)">
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="AGUARDANDO CONFIRMAÇÃO">AGUARDANDO CONFIRMAÇÃO</option>
                    <option value="REVISÃO">REVISÃO</option>
                    <option value="OPERAÇÕES">OPERAÇÕES</option>
                    <option value="METEOROLOGIA">METEOROLOGIA</option>
                    <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                    <option value="INDISPONIBILIDADE">INDISPONIBILIDADE</option>
                  </select>
                </template>
              </div>
              <div v-else-if="label === 'Base'" class="sc"><div class="sv">{{ block.id.startsWith('MC') ? 'MC01' : block.id.includes('COLT') ? 'COLT' : block.ae }}</div></div>
            </template>
          </div>
        </div>

        <div class="btn-row" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
          <div class="bl"></div>
          <div v-for="slot in block.slots" :key="slot.id + '-btn'" class="bcell">
            <button class="btn-cav" :class="buttonClass(slot)" @click="onApproveIncentivo(slot)">
              {{ buttonLabel(slot) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>CCO · Editor de Escala v10 · SAFE Aviation School</span>
      <span class="footer-badge">Node.js</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const dragSourceId = ref(null)
const rowLabels = ['Aluno', 'Instrutor', 'AE', 'Missão', 'Status', 'Base']

const jornadaRows = computed(() => {
  const byInstr = {}
  store.state.SCH.forEach((slot) => {
    if (!slot.inva || slot.anac || !slot.aluno) return
    if (!byInstr[slot.inva]) byInstr[slot.inva] = []
    byInstr[slot.inva].push(slot)
  })
  return Object.entries(byInstr).map(([instr, slots]) => {
    const times = slots.sort((a, b) => a.hora.localeCompare(b.hora)).map((slot) => slot.hora).join(' · ')
    const hs = slots.map((slot) => store.hv(slot.hora)).filter((v) => v > 0)
    const duration = Math.max(...hs) - Math.min(...hs) + 2
    let barClass = 'jok'
    if (duration > 11) barClass = 'jerr'
    else if (duration >= 10) barClass = 'jwrn'
    return { instr, times, duration: duration.toFixed(0), fill: Math.min(100, Math.round((duration / 11) * 100)), barClass }
  })
})

function onInstructorChange(slotId, value) {
  store.updateSlotInstructor(slotId, value)
}

function onStatusChange(slotId, value) {
  store.updateSlotStatus(slotId, value)
}

function instructorOptions(slot, authorizedOnly) {
  const names = Object.keys(store.state.INST).filter((name) => {
    const d = store.state.INST[name]
    if (!d) return false
    if (d.tipo === 'anac') return false
    if (!store.isAuth(name, slot.barra)) return false
    if (authorizedOnly) return true
    return !store.isAuth(name, slot.barra)
  })
  return names
}

function slotCellClass(slot) {
  return store.getSlotClass(slot)
}

function buttonLabel(slot) {
  if (slot.anac) return '🔒 ANAC'
  if (!slot.aluno) return store.SKIP_VALIDATION_ST?.has(slot.st) ? slot.st : 'Disponível'
  if (store.SKIP_VALIDATION_ST?.has(slot.st)) return slot.st
  if (slot.navsolo) return slot.inva ? '✓ Solo OK' : '⛔ Sem Instr. Solo'
  if (isInc(slot.aluno) && slot.incentOk) return '✅ Aprovado'
  if (isInc(slot.aluno) && store.getErrs(slot).some((e) => e.code === 'CONSEC_INC')) return '⚠ Incentivo'
  const errors = [...store.getErrs(slot), ...crossForSlot(slot)]
  if (errors.some((e) => e.code === 'SIMULT')) return '🚫 Simultâneo'
  if (errors.some((e) => ERR_CODES.has(e.code))) return '⛔ Problema'
  if (slot.inva && errors.some((e) => e.code === 'CONSEC')) return '⚠ Consecutiv.'
  if (!slot.inva) return '⛔ Sem instrutor'
  return '✓ OK'
}

function buttonClass(slot) {
  if (slot.anac) return 'btn-anac'
  if (!slot.aluno) return slot.st && store.SKIP_VALIDATION_ST?.has(slot.st) ? 'btn-mod-err' : 'btn-disp'
  if (store.SKIP_VALIDATION_ST?.has(slot.st)) return 'btn-mod-err'
  if (slot.navsolo) return slot.inva ? 'btn-mod-ok' : 'btn-mod-err'
  if (isInc(slot.aluno) && slot.incentOk) return 'btn-mod-ok'
  const errors = [...store.getErrs(slot), ...crossForSlot(slot)]
  if (isInc(slot.aluno) && errors.some((e) => e.code === 'CONSEC_INC')) return 'btn-mod-inc'
  if (errors.some((e) => e.code === 'SIMULT')) return 'btn-mod-err'
  if (errors.some((e) => ERR_CODES.has(e.code))) return 'btn-mod-err'
  if (slot.inva && errors.some((e) => e.code === 'CONSEC')) return 'btn-mod-wrn'
  if (!slot.inva) return 'btn-mod-err'
  return 'btn-mod-ok'
}

function onApproveIncentivo(slot) {
  if (isInc(slot.aluno)) store.approveIncentivo(slot.id)
}

const ERROR_CODES = ['CONSEC_INC', 'SIMULT', 'FOLGA', 'BARRA', 'NO_INSTR', 'JORNADA', 'LAB', 'MISSAO_REST']

function isInc(aluno) {
  return aluno && aluno.toUpperCase().includes('INCENTIVO')
}

function crossForSlot(slot) {
  const ce = store.getCross(store.state.SCH)
  return ce[slot.id] || []
}

function onDragStart(id) {
  dragSourceId.value = id
}

function onDragEnd() {
  dragSourceId.value = null
}

function onDragOver(id) {
  if (dragSourceId.value && dragSourceId.value !== id) {
    // no-op, purely to allow drop
  }
}

function onDragLeave(id) {
  // no-op
}

function onDropSlot(id) {
  if (!dragSourceId.value || dragSourceId.value === id) return
  store.swapSlots(dragSourceId.value, id)
  dragSourceId.value = null
}

const alertList = computed(() => {
  const alerts = []
  const ce = store.getCross(store.state.SCH)
  store.state.SCH.forEach((slot) => {
    if (!slot.aluno) return
    const all = [...store.getErrs(slot), ...(ce[slot.id] || [])]
    all.forEach((e) => {
      if (e.msg) alerts.push(e)
    })
  })
  return alerts
})
</script>

<style scoped>
.editor-screen {
  width: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}
.topbar img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  opacity: 0.85;
}
.topbar h1 {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin: 0;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}
.score-box {
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}
.score-num {
  font-size: 17px;
  font-weight: bold;
}
.btn-auto,
.btn-reset,
.btn-back {
  border: none;
  border-radius: 5px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.btn-auto {
  background: #5baee2;
  color: #fff;
}
.btn-auto:hover { background: #4a9fd0; }
.btn-reset { background: #888; color: #fff; }
.btn-reset:hover { background: #666; }
.btn-back { background: #1d3a52; color: #fff; }
.btn-back:hover { background: #162e42; }
.shuffle-log {
  margin-bottom: 10px;
  font-size: 11.5px;
  padding: 7px 12px;
  background: #e8f4fd;
  border-left: 3px solid #2980b9;
  border-radius: 3px;
  color: #1a4a80;
  line-height: 1.6;
}
.alert-panel {
  margin-bottom: 12px;
}
.alert-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 3px;
  font-size: 11.5px;
  line-height: 1.4;
  border-left: 3px solid;
}
.al-err { background: #fdecea; border-color: #c0392b; color: #5a0d0d; }
.al-ok { background: #d4edda; border-color: #1e7e34; color: #0f4020; font-weight: bold; }
.panels {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.panel-box {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 10px;
  min-width: 260px;
  flex: 1;
}
.panel-box h3 { margin: 0 0 10px; font-size: 12px; }
.disp-group { margin-bottom: 12px; }
.disp-group-label { font-size: 10px; font-weight: bold; color: #1d2951; margin-bottom: 6px; }
.disp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ic { display: inline-block; font-size: 10px; padding: 2px 5px; border-radius: 3px; margin: 2px; font-weight: bold; cursor: pointer; }
.ic-ok { background: #d4edda; color: #155724; }
.ic-folga { background: #fdecea; color: #7b1a19; text-decoration: line-through; }
.ic-cond { background: #fef9e7; color: #856404; }
.tabs { display: flex; gap: 3px; margin-bottom: 0; }
.tab-btn { padding: 8px 24px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; border-radius: 6px 6px 0 0; background: #aaa; color: #fff; transition: background 0.15s; display: flex; align-items: center; gap: 8px; }
.tab-btn.t-sjk { background: #1d2951; }
.tab-btn.t-cpq { background: #1d3a52; }
.tscore { font-size: 11px; background: rgba(255, 255, 255, 0.22); padding: 1px 7px; border-radius: 10px; }
.barra-bloco { margin-bottom: 12px; border-radius: 0 4px 4px 4px; overflow: hidden; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18); }
.bh { display: grid; background: #1d2951; color: #fff; font-weight: bold; font-size: 13px; }
.bh .hd { padding: 8px 12px; line-height: 1.35; min-width: 110px; }
.bh .d1 { font-size: 13px; }
.bh .d2 { font-size: 12px; font-weight: normal; }
.hh { display: flex; align-items: center; justify-content: center; padding: 8px 4px; border-left: 1px solid rgba(255, 255, 255, 0.18); font-size: 14px; white-space: nowrap; }
.drag-indicator { opacity: 0.4; font-size: 10px; margin-left: 4px; }
.barra-body { background: #fff; }
.brow { display: grid; border-bottom: 1px dashed #d0d0d0; min-height: 34px; overflow: hidden; }
.brow:last-child { border-bottom: none; }
.rl { padding: 6px 10px; background: #f0f0f0; font-size: 12px; font-weight: bold; color: #444; border-right: 1px solid #ddd; display: flex; align-items: center; min-width: 110px; }
.sc { border-right: 1px solid #ddd; min-height: 34px; display: flex; align-items: center; overflow: hidden; }
.sc:last-child { border-right: none; }
.sc-empty { background: #cce4ee; }
.sc-filled { background: #fff; }
.sc-err { background: #fdecea; }
.sc-warn { background: #fef9e7; }
.sc-incent { background: #fff8e1; }
.sc-ok-manual { background: #eafaf1; }
.sc-anac { background: #eaf4fb; }
.sc-st-conf { background: #fff; }
.sc-st-agua { background: #fffde7; }
.sc-st-other { background: #fdecea; }
.sc select { width: 100%; border: none; background: transparent; font-size: 11px; font-family: Arial, sans-serif; padding: 4px 6px; cursor: pointer; color: #222; appearance: none; outline: none; }
.sc select:focus { background: #fffde7; }
.sv { display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; padding: 4px 6px; width: 100%; line-height: 1.3; word-break: break-word; }
.locked { color: #1a4a80; font-weight: bold; font-size: 11px; }
.btn-row { display: grid; background: #f0f0f0; border-top: 1px solid #ddd; }
.bl { min-height: 4px; }
.bcell { padding: 5px 4px; display: flex; align-items: center; justify-content: center; }
.btn-cav { border: none; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; padding: 5px 4px; width: 100%; text-align: center; }
.btn-mod-ok { background: #27ae60; color: #fff; cursor: default; }
.btn-mod-err { background: #c0392b; color: #fff; cursor: default; }
.btn-mod-wrn { background: #d4821a; color: #fff; cursor: default; }
.btn-mod-inc { background: #f39c12; color: #fff; cursor: pointer; }
.btn-mod-inc:hover { background: #d68910; }
.btn-disp { background: #1d2951; color: #fff; cursor: default; }
.btn-anac { background: #2980b9; color: #fff; cursor: default; }
.footer { margin-top: 10px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 6px; display: flex; align-items: center; justify-content: space-between; }
.footer-badge { background: #1d2951; color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
.empty-message { color: #999; font-size: 11px; padding: 12px; }
</style>
