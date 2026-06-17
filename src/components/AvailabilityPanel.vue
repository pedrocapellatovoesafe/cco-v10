<template>
  <div class="panels">
    <div class="panel-box">
      <h3>Disponibilidade</h3>
      <div class="disp-panel">
        <div class="disp-group" v-for="base in ['SJK', 'CPQ']" :key="base">
          <div class="disp-group-label">{{ base }}</div>
          <div class="disp-sections">
            <div class="disp-section">
              <span class="disp-section-title">Voo:</span>
              <div class="disp-chips">
                <span
                  v-for="instr in (store.availabilityGroups?.value?.[base]?.voo || [])"
                  :key="instr.nome"
                  class="ic"
                  :class="store.availabilityClass(instr.nome)"
                  :data-tooltip="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
                >
                  {{ instr.nome ? instr.nome.split(' ')[0] : '—' }}
                </span>
              </div>
            </div>
            <div class="disp-section">
              <span class="disp-section-title">Solo:</span>
              <div class="disp-chips">
                <span
                  v-for="instr in (store.availabilityGroups?.value?.[base]?.solo || [])"
                  :key="instr.nome"
                  class="ic ic-static"
                  :class="store.availabilityClass(instr.nome)"
                  :data-tooltip="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
                >
                  {{ instr.nome ? instr.nome.split(' ')[0] : '—' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const store = inject('store')
</script>

<style scoped>
.panels { margin-bottom: 16px; }
.panel-box { padding: 18px; background: #fff; border: 1px solid #dae2ec; border-radius: 16px; }
.panel-box h3 { margin: 0 0 14px; font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; }
.disp-group-label { display: inline-block; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: var(--primary); }
.disp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.disp-sections { display: flex; flex-direction: column; gap: 12px; }
.disp-section { display: flex; align-items: flex-start; gap: 10px; }
.disp-section-title { font-size: 10px; font-weight: 800; color: #5a6370; text-transform: uppercase; margin-top: 6px; min-width: 35px; }
.ic {
  font-size: 10px;
  padding: 5px 10px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  border: 1px solid transparent;
  position: relative;
}
/* Tooltip styling */
.ic::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 135%;
  left: 50%;
  transform: translateX(-50%) translateY(4px) scale(0.9);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  line-height: 1.2;
}
.ic::after {
  content: '';
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%) translateY(4px) scale(0.9);
  border-width: 5px;
  border-style: solid;
  border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}
.ic:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
.ic:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
.ic:not(.ic-static):hover {
  transform: translateY(-2px) scale(1.08);
  filter: brightness(1.1);
}
.ic-static {
  cursor: default;
}
.ic-static:hover {
  transform: scale(1.04);
  filter: brightness(1.05);
}
.ic:active:not(.ic-static) {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.ic.avail { background: #27ae60; }
.ic.avail:hover { box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4); }
.ic.folga-reg { background: #c0392b; }
.ic.folga-reg:hover { box-shadow: 0 4px 12px rgba(192, 57, 43, 0.4); }
.ic.folga-soc { background: #e67e22; }
.ic.folga-soc:hover { box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4); }
.ic.sobreaviso { background: #f1c40f; color: #000; }
.ic.sobreaviso:hover { box-shadow: 0 4px 12px rgba(241, 196, 15, 0.4); }
.ic.treinamento { background: #3498db; }
.ic.treinamento:hover { box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
.ic.ferias { background: #9b59b6; }
.ic.ferias:hover { box-shadow: 0 4px 12px rgba(155, 89, 182, 0.4); }
.ic.banco { background: #1abc9c; }
.ic.banco:hover { box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4); }
.ic.operacoes { background: #34495e; }
.ic.operacoes:hover { box-shadow: 0 4px 12px rgba(52, 73, 94, 0.4); }
.ic.externo { background: #7f8c8d; }
.ic.externo:hover { box-shadow: 0 4px 12px rgba(127, 140, 140, 0.4); }
.ic.medica { background: #000000; }
.ic.medica:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }
.ic.outro { background: #bdc3c7; color: #000; }
.ic.outro:hover { box-shadow: 0 4px 12px rgba(189, 195, 199, 0.4); }
</style>
