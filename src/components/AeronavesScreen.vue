<template>
  <div class="screen-layout">
    <div id="ae-screen" class="aeronaves-screen">
      <div class="ae-header">
        <div class="ae-title-area">
          <h1>✈️ Gestão de Aeronaves</h1>
          <p>Visualize e gerencie a frota e disponibilidade (horas)</p>
        </div>
        <div class="header-actions">
          <button class="btn-ae-back" @click="() => router.push('/configuracoes')">⚙️ Configurações</button>
          <button class="btn-ae-back" @click="handleBackToEditor">← Voltar ao Editor</button>
          <button class="btn-logout-ae" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="ae-grid">
        <!-- Listagem de Aeronaves -->
        <div class="ae-card list-card">
          <div class="card-header">
            <h3>📋 Frota Ativa ({{ store.AERONAVES.length }})</h3>
          </div>
          <div class="card-body scrollable">
            <div v-if="store.AERONAVES.length === 0" class="empty-list">
              Nenhuma aeronave carregada.
            </div>
            <div v-for="ae in store.AERONAVES" :key="ae.id" 
                 :class="['ae-item', selectedAe?.id === ae.id ? 'active' : '']"
                 @click="selectAe(ae)">
              <div class="ae-info">
                <span class="ae-prefixo">{{ ae.nome }}</span>
                <span class="ae-modelo">{{ ae.modeloAeronave?.nome || 'Modelo não inf.' }}</span>
              </div>
              <div class="ae-stats">
                <span class="ae-hours-badge" :class="getHoursClass(ae.horasDisponiveis)">
                  {{ ae.horasDisponiveis || 0 }}h disp.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Edição -->
        <div class="ae-card form-card">
          <div class="card-header">
            <h3>✏️ {{ selectedAe ? 'Editar: ' + selectedAe.nome : 'Selecione uma aeronave' }}</h3>
          </div>
          <div class="card-body">
            <div v-if="!selectedAe" class="form-placeholder">
              <p>Clique em uma aeronave na lista ao lado para editar suas propriedades.</p>
            </div>
            <div v-else class="form-container">
              <div class="form-group">
                <label>Horas Disponíveis para Programação:</label>
                <input 
                  type="number" 
                  step="0.1"
                  v-model="form.horasDisponiveis" 
                  placeholder="Ex: 50.0" 
                  class="form-input" 
                />
                <p class="input-help">Informe o saldo de horas disponível antes da próxima manutenção.</p>
              </div>

              <div class="form-actions">
                <button class="btn-save" @click="handleSave" :disabled="isSaving">
                  {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
                <button class="btn-cancel" @click="selectedAe = null" :disabled="isSaving">
                  Cancelar
                </button>
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
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const selectedAe = ref(null)
const isSaving = ref(false)
const form = reactive({
  horasDisponiveis: 0
})

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await store.fetchAeronaves()
  } finally {
    store.state.globalLoading = false
  }
})

function selectAe(ae) {
  selectedAe.value = ae
  form.horasDisponiveis = ae.horasDisponiveis || 0
}

function getHoursClass(hours) {
  const h = parseFloat(hours || 0)
  if (h <= 5) return 'low'
  if (h <= 15) return 'mid'
  return 'high'
}

async function handleSave() {
  if (!selectedAe.value) return
  isSaving.value = true
  
  try {
    const res = await store.updateAeronave(selectedAe.value.id, {
      horasDisponiveis: parseFloat(form.horasDisponiveis)
    })
    
    if (res.success) {
      showToast('Aeronave atualizada com sucesso!', 'success')
      selectedAe.value = null
    } else {
      showToast(res.error || 'Erro ao atualizar aeronave', 'danger')
    }
  } catch (e) {
    showToast('Erro técnico ao salvar.', 'danger')
  } finally {
    isSaving.value = false
  }
}

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
  padding: 24px;
  background: var(--bg-main);
}
.aeronaves-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.ae-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  background: var(--primary);
  color: #fff;
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-bottom: 4px solid var(--secondary);
}
.ae-title-area h1 { font-size: 20px; font-weight: 800; margin: 0; font-family: var(--font-title); text-transform: uppercase; }
.ae-title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }

.header-actions { display: flex; gap: 12px; }
.btn-ae-back, .btn-logout-ae {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ae-back:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.btn-logout-ae { background: #c0392b; border: none; }

.ae-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.ae-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #dae2ec;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.card-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--primary);
  font-weight: 800;
}

.card-body { padding: 24px; }
.scrollable { max-height: 600px; overflow-y: auto; padding: 12px; }

.ae-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.ae-item:hover { border-color: var(--primary); background: #f8fafc; transform: translateX(4px); }
.ae-item.active { border-color: var(--primary); background: var(--primary-light); box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.1); }

.ae-info { display: flex; flex-direction: column; }
.ae-prefixo { font-size: 16px; font-weight: 800; color: var(--primary); }
.ae-modelo { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.ae-hours-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}
.ae-hours-badge.high { background: #dcfce7; color: #166534; }
.ae-hours-badge.mid { background: #fef9c3; color: #854d0e; }
.ae-hours-badge.low { background: #fee2e2; color: #991b1b; }

.form-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-style: italic;
}

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: var(--primary); }
.form-input {
  width: 100%; padding: 12px; border: 1px solid #d8dee8; border-radius: 10px;
  font-size: 14px; color: var(--primary); outline: none; transition: all 0.2s;
}
.form-input:focus { border-color: var(--secondary); box-shadow: 0 0 0 3px rgba(var(--secondary-rgb), 0.1); }
.input-help { margin-top: 6px; font-size: 11px; color: var(--text-muted); font-style: italic; }

.form-actions { display: flex; gap: 12px; margin-top: 30px; }
.btn-save {
  flex: 2; padding: 14px; background: var(--secondary); color: var(--white); border: none;
  border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-save:hover:not(:disabled) { background: var(--primary); transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel {
  flex: 1; padding: 14px; background: #f1f5f9; color: #475569; border: none;
  border-radius: 10px; font-weight: 700; cursor: pointer;
}

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 12px 20px; border-radius: 12px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }

@media (max-width: 768px) {
  .ae-grid { grid-template-columns: 1fr; }
}
</style>
