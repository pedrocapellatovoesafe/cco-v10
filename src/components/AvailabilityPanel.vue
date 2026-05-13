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
                  :title="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
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
                  :title="instr.nome + ' (' + store.availabilityLabel(instr.nome) + ')'"
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
.panel-box h3 { margin: 0 0 14px; font-size: 12px; font-weight: 700; color: #1d2951; text-transform: uppercase; }
.disp-group-label { display: inline-block; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: #1d2951; }
.disp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.disp-sections { display: flex; flex-direction: column; gap: 12px; }
.disp-section { display: flex; align-items: flex-start; gap: 10px; }
.disp-section-title { font-size: 10px; font-weight: 800; color: #5a6370; text-transform: uppercase; margin-top: 6px; min-width: 35px; }
.ic { font-size: 10px; padding: 5px 8px; border-radius: 999px; font-weight: 700; cursor: pointer; color: #fff; }
.ic-static { cursor: default; }
.ic.avail { background: #27ae60; }
.ic.folga-reg { background: #c0392b; }
.ic.folga-soc { background: #e67e22; }
.ic.sobreaviso { background: #f1c40f; color: #000; }
.ic.treinamento { background: #3498db; }
.ic.ferias { background: #9b59b6; }
.ic.banco { background: #1abc9c; }
.ic.operacoes { background: #34495e; }
.ic.externo { background: #7f8c8d; }
.ic.medica { background: #000000; }
.ic.outro { background: #bdc3c7; color: #000; }
</style>
