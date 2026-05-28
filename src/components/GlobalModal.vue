<template>
  <transition name="fade">
    <div v-if="store.state.globalModal?.show" class="modal-overlay" @click.self="close">
      <div class="modal-content" :class="`type-${store.state.globalModal.type}`">
        <div class="modal-header">
          <h3>{{ store.state.globalModal.title || 'Notificação' }}</h3>
          <button class="close-btn" @click="close">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-icon">
            <span v-if="store.state.globalModal.type === 'success'">✅</span>
            <span v-else-if="store.state.globalModal.type === 'error'">❌</span>
            <span v-else>ℹ️</span>
          </div>
          <p>{{ store.state.globalModal.message }}</p>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="close">OK</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('store')

function close() {
  store.closeAlert()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--white);
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 16px 24px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 30px 24px;
  text-align: center;
}

.modal-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.modal-body p {
  margin: 0;
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
  font-weight: 500;
}

.modal-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.confirm-btn {
  padding: 12px 40px;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #2a3b59;
  transform: translateY(-1px);
}

.type-error .modal-header h3 { color: #ef4444; }
.type-error .confirm-btn { background: #ef4444; }
.type-error .confirm-btn:hover { background: #dc2626; }

.type-success .modal-header h3 { color: #10b981; }
.type-success .confirm-btn { background: #10b981; }
.type-success .confirm-btn:hover { background: #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
