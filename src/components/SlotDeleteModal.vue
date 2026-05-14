<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content modal-danger">
      <div class="modal-header">
        <h3>Excluir Registro</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body text-center">
        <div class="danger-icon">🗑️</div>
        <p>Deseja realmente excluir o registro de <strong>{{ slot?.aluno || 'Aluno não informado' }}</strong>?</p>
        <p class="text-muted">Esta ação não poderá ser desfeita.</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
        <button class="btn-confirm-delete" @click="$emit('confirm')">Confirmar Exclusão</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  slot: Object
})
defineEmits(['close', 'confirm'])
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 450px; border-radius: 16px; overflow: hidden; }
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
  color: #1d2951;
}
.modal-body { padding: 22px; }
.modal-danger .modal-header { background: #fee2e2; color: #991b1b; }
.danger-icon { font-size: 40px; margin-bottom: 15px; color: #c0392b; }
.text-center { text-align: center; }
.text-muted { color: #64748b; font-size: 12px; margin-top: 8px; }
.modal-footer { padding: 16px 22px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
.btn-cancel { background: #e2e8f0; color: #475569; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-right: 10px; }
.btn-confirm-delete { background: #c0392b; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
</style>
