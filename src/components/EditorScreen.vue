<template>
  <div class="screen-layout">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Sincronizando dados com o servidor...</p>
    </div>
    <div id="editor-screen" class="editor-screen" v-else>
      <div class="topbar">
        <img :src="iconUrl" alt="SAFE" style="width:28px;height:28px;border-radius:50%;opacity:.85;" />
        <h1>{{ store.state.editorTitle }}</h1>
        <div class="controls">
          <div class="score-box">🟢 <span class="score-num sg">{{ store.scoreOk.value }}</span> &nbsp;|&nbsp; 🔴 <span class="score-num sr">{{ store.scoreErr.value }}</span></div>
          <button class="btn-auto" @click="store.smartShuffle">⚡ Auto-resolver</button>
          <button class="btn-reset" @click="store.resetSchedule">↺ Reset</button>
          <button class="btn-back" @click="() => router.push('/upload')">📂 Nova escala</button>
          <button class="btn-logout-editor" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="shuffle-log" v-if="store.state.shuffleLog">{{ store.state.shuffleLog }}</div>
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
                v-for="instr in store.availabilityGroups.value[base].voo"
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
        <button :class="['tab-btn', store.state.activeTab === 'SJK' ? 't-sjk' : '']" @click="store.state.activeTab = 'SJK'">✈ SJK <span class="tscore">{{ store.scoreSjk.value }}</span></button>
        <button :class="['tab-btn', store.state.activeTab === 'CPQ' ? 't-cpq' : '']" @click="store.state.activeTab = 'CPQ'">✈ CPQ <span class="tscore">{{ store.scoreCpq.value }}</span></button>
      </div>

      <div class="tab-panel active">
        <div v-for="block in store.scheduleBlocks.value[store.state.activeTab]" :key="block.id" class="barra-bloco">
          <div class="bh" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
            <div class="hd"><div class="d1">{{ store.state.parsedDate }}</div><div class="d2">{{ store.state.parsedDayName }}</div></div>
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
                    <select class="slot-input" v-model="slot.inva" @change="onInstructorChange(slot.id, slot.inva)">
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
                <div v-else-if="label === 'Aeronave'" class="sc">
                  <template v-if="slot.anac"><div class="sv">{{ slot.ae }}</div></template>
                  <template v-else>
                    <select class="slot-input" v-model="slot.ae" @change="onAeronaveChange(slot.id, slot.ae)">
                      <option value="">—</option>
                      <option v-for="aero in store.getAeronavesByBarra(slot.barra, slot.ae)" :key="aero.id" :value="aero.nome">
                        {{ aero.nome }}
                      </option>
                    </select>
                  </template>
                </div>
                <div v-else-if="label === 'Missão'" class="sc" :class="slot.missao ? '' : 'sc-empty'"><div class="sv">{{ slot.missao }}</div></div>
                <div v-else-if="label === 'Status'" class="sc">
                  <template v-if="slot.aluno && !slot.anac">
                    <select class="slot-input" v-model="slot.st" @change="onStatusChange(slot.id, slot.st)">
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
                <div v-else-if="label === 'Barra'" class="sc"><div class="sv">{{ slot.barra }}</div></div>
              </template>
            </div>
          </div>

          <div class="btn-row" :style="{ gridTemplateColumns: `110px repeat(${block.slots.length}, 1fr)` }">
            <div class="bl"></div>
            <div v-for="slot in block.slots" :key="slot.id + '-btn'" class="bcell">
              <div class="btn-container">
                <button class="btn-cav" :class="buttonClass(slot)" @click="onApproveIncentivo(slot)">
                  {{ buttonLabel(slot) }}
                </button>
                <div v-if="buttonLabel(slot) === '⛔ Problema'" class="tooltip">
                  <div class="tooltip-content">
                    <div v-for="error in getSlotErrorMessages(slot)" :key="error" class="tooltip-line">{{ error }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <span>CCO · Editor de Escala v10 · SAFE Aviation School</span>
        <span class="footer-badge">Node.js</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const isLoading = ref(true)

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      store.fetchSlots(),
      store.fetchBars(),
      store.fetchAeronaves()
    ])
    // Generate editor after all data is available
    store.generateEditor()
  } finally {
    isLoading.value = false
  }
})
const dragSourceId = ref(null)
const rowLabels = ['Aluno', 'Instrutor', 'Aeronave', 'Missão', 'Status', 'Barra']

const jornadaRows = computed(() => {
  if (!store?.state?.SCH) return []
  const byInstr = {}
  store.state.SCH.forEach((slot) => {
    if (!slot.inva || slot.anac || !slot.aluno) return
    if (!byInstr[slot.inva]) byInstr[slot.inva] = []
    byInstr[slot.inva].push(slot)
  })
  return Object.entries(byInstr).map(([instr, slots]) => {
    const sortedSlots = [...slots].sort((a, b) => a.hora.localeCompare(b.hora))
    const times = sortedSlots.map((slot) => slot.hora).join(' · ')
    const hs = sortedSlots.map((slot) => store.hv(slot.hora)).filter((v) => v > 0)
    
    let duration = 0
    if (hs.length > 0) {
      duration = Math.max(...hs) - Math.min(...hs) + 2
    }
    
    let barClass = 'jok'
    if (duration > 11) barClass = 'jerr'
    else if (duration >= 10) barClass = 'jwrn'
    return { instr, times, duration: duration.toFixed(0), fill: Math.min(100, Math.round((duration / 11) * 100)), barClass }
  })
})

function onInstructorChange(slotId, value) {
  store.updateSlotInstructor(slotId, value)
}

function onAeronaveChange(slotId, value) {
  store.updateSlotAeronave(slotId, value)
}

function onStatusChange(slotId, value) {
  store.updateSlotStatus(slotId, value)
}

function instructorOptions(slot, authorizedOnly) {
  const names = Object.keys(store.state.INST).filter((name) => {
    const d = store.state.INST[name]
    if (!d) return false
    if (d.tipo === 'anac') return false
    const isAuth = store.isAuth(name, slot.barra)
    return authorizedOnly ? isAuth : !isAuth
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
  const ERR_CODES = new Set(['FOLGA', 'BARRA', 'NO_INSTR', 'JORNADA', 'SIMULT', 'LAB', 'MISSAO_REST'])
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
  const ERR_CODES = new Set(['FOLGA', 'BARRA', 'NO_INSTR', 'JORNADA', 'SIMULT', 'LAB', 'MISSAO_REST'])
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

function isInc(aluno) {
  return aluno && aluno.toUpperCase().includes('INCENTIVO')
}

function crossForSlot(slot) {
  const ce = store.getCross(store.state.SCH)
  return ce[slot.id] || []
}

function getSlotErrorTooltip(slot) {
  const errors = [...store.getErrs(slot), ...crossForSlot(slot)]
  return errors.map(e => e.msg).filter(msg => msg).join('\n')
}

function getSlotErrorMessages(slot) {
  const errors = [...store.getErrs(slot), ...crossForSlot(slot)]
  return errors.map(e => e.msg).filter(msg => msg)
}

function onDragStart(id) {
  dragSourceId.value = id
}

function onDragEnd() {
  dragSourceId.value = null
}

function onDragOver(id) {
  // logic to allow drop
}

function onDragLeave(id) {
  // logic
}

function onDropSlot(id) {
  if (!dragSourceId.value || dragSourceId.value === id) return
  store.swapSlots(dragSourceId.value, id)
  dragSourceId.value = null
}

function handleLogout() {
  store.logout()
  router.push('/login')
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
.screen-layout {
  min-height: 100vh;
  padding: 24px;
  background: #f0f4f8;
  position: relative;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(240, 244, 248, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 14px;
}
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1d2951;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.editor-screen {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 14px;
  box-shadow: 0 16px 32px rgba(14, 38, 72, 0.08);
}
.topbar img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  opacity: 0.9;
}
.topbar h1 {
  font-size: 17px;
  font-weight: 700;
  color: #1d2951;
  margin: 0;
  letter-spacing: 0.02em;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
}
.score-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #eef4fb;
  border: 1px solid #cfdce9;
  color: #1d2951;
  font-size: 13px;
  font-weight: 700;
}
.score-num { font-size: 16px; }
.btn-auto,
.btn-reset,
.btn-back,
.btn-logout-editor {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-auto {
  background: #5baee2;
  color: #fff;
}
.btn-auto:hover { background: #4a9fd0; transform: translateY(-1px); }
.btn-reset { background: #888; color: #fff; }
.btn-reset:hover { background: #666; transform: translateY(-1px); }
.btn-back { background: #1d3a52; color: #fff; }
.btn-back:hover { background: #162e42; transform: translateY(-1px); }
.btn-logout-editor {
  background: #c0392b;
  color: #fff;
}
.btn-logout-editor:hover { background: #a93226; transform: translateY(-1px); }
.shuffle-log {
  margin: 16px 0 12px;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 12px;
  background: #e8f4fd;
  border-left: 4px solid #2980b9;
  color: #1a4a80;
}
.alert-panel { margin-bottom: 16px; display: grid; gap: 8px; }
.alert-line {
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 12px;
  border-left: 4px solid;
}
.al-err { background: #fdecea; border-color: #c0392b; color: #5a0d0d; }
.al-ok { background: #d4edda; border-color: #1e7e34; color: #0f4020; font-weight: 700; }
.panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.panel-box {
  padding: 18px 18px 16px;
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 16px;
}
.panel-box h3 {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #1d2951;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.disp-group { margin-bottom: 18px; }
.disp-group-label {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #1d2951;
  letter-spacing: 0.04em;
}
.disp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ic {
  font-size: 10px;
  padding: 5px 8px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}
.ic-ok { background: #d4edda; color: #155724; }
.ic-folga { background: #fdecea; color: #7b1a19; text-decoration: line-through; }
.ic-cond { background: #fef9e7; color: #856404; }
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}
.tab-btn {
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  border-radius: 999px;
  background: #d4d4d4;
  color: #1b1b1b;
  cursor: pointer;
  transition: background 0.15s ease;
}
.tab-btn.t-sjk { background: #1d2951; color: #fff; }
.tab-btn.t-cpq { background: #1d3a52; color: #fff; }
.tscore {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}
.tab-panel.active { display: block; }
.barra-bloco {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 30px rgba(14, 38, 72, 0.08);
  margin-bottom: 18px;
}
.bh {
  display: grid;
  background: #1d2951;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
.bh .hd {
  padding: 14px 16px;
  min-width: 110px;
}
.bh .d1 { font-size: 14px; }
.bh .d2 { font-size: 12px; opacity: 0.9; }
.hh {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  font-size: 13px;
}
.drag-indicator { opacity: 0.45; font-size: 10px; margin-left: 6px; }
.barra-body { background: #fff; }
.brow {
  display: grid;
  min-height: 48px;
  border-bottom: 1px solid #e3e9f0;
  align-items: stretch;
}
.brow:last-child { border-bottom: none; }
.rl {
  padding: 14px 12px;
  background: #f6f8fb;
  font-size: 12px;
  font-weight: 700;
  color: #2a3b59;
  border-right: 1px solid #dde4ef;
  display: flex;
  align-items: center;
}
.sc {
  border-right: 1px solid #dde4ef;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 6px;
}
.sc:last-child { border-right: none; }
.sc-empty { background: #fff; }
.sc-filled { background: #fff; }
.sc-err { background: #fff; }
.sc-warn { background: #fff; }
.sc-incent { background: #fff8e1; }
.sc-ok-manual { background: #eafaf1; }
.sc-anac { background: #eaf4fb; }
.sc-st-conf { background: #fff; }
.sc-st-agua { background: #fff; }
.sc-st-other { background: #fdecea; }
.sc select,
.sv select,
.slot-input {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d8dee8;
  border-radius: 10px;
  background: #fff;
  font-size: 12px;
  font-family: inherit;
  padding: 8px 10px;
  color: #1d2951;
  cursor: pointer;
  appearance: none;
  outline: none;
}
.sc select:focus,
.sv select:focus,
.slot-input:focus {
  border-color: #5baee2;
  background: #f5fbff;
}
.sv {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  padding: 10px 8px;
  width: 100%;
  line-height: 1.3;
  word-break: break-word;
}
.locked {
  color: #1a4a80;
  font-weight: 700;
  font-size: 11px;
}
.btn-row {
  display: grid;
  background: #f5f8fc;
  border-top: 1px solid #dde4ef;
}
.bl { min-height: 4px; }
.bcell {
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-cav {
  width: 100%;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-mod-ok { background: #27ae60; color: #fff; }
.btn-mod-err { background: #c0392b; color: #fff; }
.btn-mod-wrn { background: #d4821a; color: #fff; }
.btn-mod-inc { background: #f39c12; color: #fff; }
.btn-mod-inc:hover { background: #d68910; }
.btn-disp { background: #1d2951; color: #fff; }
.btn-anac { background: #2980b9; color: #fff; }
.footer {
  margin-top: 18px;
  font-size: 11px;
  color: #5a6370;
  border-top: 1px solid #dde4ef;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.footer-badge {
  background: #1d2951;
  color: #fff;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
}
.empty-message {
  color: #7a8290;
  font-size: 12px;
  padding: 18px 14px;
}
.j-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 11px;
}
.j-name {
  min-width: 140px;
  font-weight: 700;
  color: #1d2951;
}
.j-slots {
  flex: 1;
  color: #4f5f75;
  font-size: 11px;
}
.j-bar {
  flex: 2;
  height: 6px;
  background: #e5e9f0;
  border-radius: 999px;
  overflow: hidden;
}
.j-fill {
  height: 100%;
  transition: width 0.25s ease;
}
.jok { background: #27ae60; }
.jwrn { background: #f39c12; }
.jerr { background: #c0392b; }
.j-h {
  min-width: 34px;
  text-align: right;
  font-weight: 700;
  color: #1d2951;
}
.jerr-t { color: #c0392b; }
.btn-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 1000;
  margin-bottom: 8px;
}
.btn-container:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
.tooltip-content {
  background: #2a3b59;
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  max-width: 280px;
  word-wrap: break-word;
  white-space: normal;
}
.tooltip-line {
  margin-bottom: 4px;
}
.tooltip-line:last-child {
  margin-bottom: 0;
}
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #2a3b59;
}
</style>
