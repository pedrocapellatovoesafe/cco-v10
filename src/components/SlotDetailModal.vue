<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>⚠️ Detalhes da Escala</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-slot-info">
          <p><strong>Hora:</strong> {{ slot?.hora }}</p>
          <p><strong>Barra:</strong> {{ slot?.barra }}</p>
          <p><strong>Aluno:</strong> {{ slot?.aluno }}</p>
          <p><strong>Status Atual:</strong> {{ slot?.st }}</p>
          <p><strong>Observações:</strong> {{ slot?.obs }}</p>
        </div>
        
        <div class="modal-restrictions-list" v-if="slot && slot.serverRestrictions && slot.serverRestrictions.length > 0">
          <div v-for="(rest, idx) in slot.serverRestrictions" :key="'res-' + idx" class="modal-restrict-item">
            <span class="restrict-icon">🚫</span>
            <div class="restrict-content">
              <span class="restrict-title">{{ rest.nome }}</span>
              <p class="restrict-desc">{{ rest.observacao }}</p>
            </div>
          </div>
        </div>

        <div class="modal-alerts-list" v-if="slot && store.getSlotAlerts(slot).length > 0">
          <div v-for="(alert, idx) in store.getSlotAlerts(slot)" :key="'alt-' + idx" class="modal-alert-item">
            <span class="alert-icon">⚠️</span>
            <span class="alert-text">{{ alert }}</span>
          </div>
        </div>
        <div class="modal-placeholder" v-else-if="isRestriction">
          <p>Este slot possui uma restrição operacional ou técnica ({{ slot?.st }}).</p>
        </div>
        <div class="modal-placeholder" v-else>
          <p>Nenhuma inconsistência detectada.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-ok" @click="$emit('close')">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'
const store = inject('store')

const props = defineProps({
  isOpen: Boolean,
  slot: Object
})

defineEmits(['close'])

const isRestriction = computed(() => {
  if (!props.slot) return false
  const hasRestrictions = props.slot.serverRestrictions && props.slot.serverRestrictions.length > 0
  const alerts = store.getSlotAlerts(props.slot)
  const hasAlerts = alerts.length > 0
  return hasRestrictions && !hasAlerts && !props.slot.aluno
})
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(4px); }
.modal-content { background: var(--white); width: 100%; max-width: 450px; border-radius: 16px; overflow: hidden; }
.modal-header { padding: 18px 22px; background: #f8f9fa; display: flex; align-items: center; justify-content: space-between; }
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
  color: var(--primary);
}
.modal-body { padding: 22px; }
.modal-slot-info {
  background: var(--bg-main);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.modal-slot-info p {
  margin: 6px 0;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.4;
}
.modal-alert-item { display: flex; gap: 12px; padding: 12px; background: #fff9e6; border-left: 4px solid #f39c12; border-radius: 6px; margin-bottom: 10px; }
.modal-restrict-item {
  display: flex; gap: 12px; padding: 14px; background: #fef2f2; 
  border-left: 5px solid #ef4444; border-radius: 8px; margin-bottom: 12px;
}
.restrict-icon { font-size: 18px; margin-top: 2px; }
.restrict-title { display: block; font-weight: 800; color: #991b1b; font-size: 14px; margin-bottom: 4px; }
.restrict-desc { margin: 0; font-size: 13px; color: #b91c1c; line-height: 1.4; opacity: 0.9; }

.modal-footer { padding: 16px 22px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
.btn-modal-ok { background: var(--primary); color: var(--white); border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-modal-ok:hover { background: #2a3b59; }
</style>
