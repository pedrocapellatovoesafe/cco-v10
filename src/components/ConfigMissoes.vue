<template>
  <div class="screen-layout">
    <div class="config-module">
      <div class="module-header">
        <div class="title-area">
          <h1>🎯 Catálogo Geral de Missões</h1>
          <p>Visualize e gerencie todas as missões cadastradas no sistema</p>
        </div>
        <div class="header-actions">
          <button class="btn-back-nav" @click="router.push('/configuracoes')">← Voltar</button>
        </div>
      </div>

      <div class="list-card full-width">
        <div class="card-header">
          <div class="search-box">
            <input type="text" v-model="searchQuery" placeholder="🔍 Buscar missão ou curso..." class="search-input" />
          </div>
          <button class="btn-add" @click="router.push('/configuracoes/cursos')">⚙️ Gerenciar por Curso</button>
        </div>
        
        <div class="card-body scrollable">
          <div class="table-container">
            <table class="config-table">
              <thead>
                <tr>
                  <th>Missão</th>
                  <th>Curso Relacionado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredMissoes.length === 0">
                  <td colspan="3" class="empty-list">Nenhuma missão encontrada.</td>
                </tr>
                <tr v-for="m in filteredMissoes" :key="m.id">
                  <td>
                    <input type="text" v-model="m.nome" class="table-input" @change="handleUpdateMissao(m)" />
                  </td>
                  <td>
                    <span class="tag-curso">{{ getCursoNome(m.cursoId) }}</span>
                  </td>
                  <td>
                    <button class="btn-del-small" @click="handleDeleteMissao(m)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
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
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const searchQuery = ref('')
const toast = reactive({ show: false, message: '', type: 'success' })

function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const filteredMissoes = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const allMissoes = []
  
  // Flatten missoes from cursos for easier searching if store.MISSOES is not populated yet
  if (store.CURSOS.value) {
    store.CURSOS.value.forEach(c => {
      if (c.missoes) {
        c.missoes.forEach(m => {
          allMissoes.push({ ...m, cursoNome: c.nome })
        })
      }
    })
  }

  return allMissoes.filter(m => 
    m.nome.toLowerCase().includes(query) || 
    m.cursoNome.toLowerCase().includes(query)
  ).sort((a, b) => a.nome.localeCompare(b.nome))
})

onMounted(async () => {
  store.state.globalLoading = true
  try {
    await store.fetchCursos()
  } finally {
    store.state.globalLoading = false
  }
})

function getCursoNome(cursoId) {
  const curso = store.CURSOS.value.find(c => c.id === cursoId)
  return curso ? curso.nome : 'N/A'
}

async function handleUpdateMissao(m) {
  const res = await store.updateMissao(m.id, { nome: m.nome, cursoId: m.cursoId })
  if (res.success) {
    showToast('Missão atualizada')
  } else {
    showToast(res.error || 'Erro ao atualizar', 'danger')
  }
}

async function handleDeleteMissao(m) {
  if (!confirm(`Deseja excluir a missão "${m.nome}"?`)) return
  const res = await store.deleteMissao(m.id)
  if (res.success) {
    showToast('Missão excluída')
  } else {
    showToast(res.error || 'Erro ao excluir', 'danger')
  }
}
</script>

<style scoped>
.screen-layout { padding: 24px; background: var(--bg-main); min-height: 100vh; }
.config-module { width: 100%; max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

.module-header {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--primary); color: #fff; padding: 20px 28px; border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-bottom: 4px solid var(--secondary);
}
.title-area h1 { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; }
.title-area p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
.btn-back-nav { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }

.list-card { background: #fff; border-radius: 16px; border: 1px solid #dae2ec; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
.full-width { width: 100%; }

.card-header { padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.search-box { flex: 1; margin-right: 16px; }
.search-input { width: 100%; padding: 10px 14px; border: 1px solid #d8dee8; border-radius: 8px; font-size: 14px; outline: none; }
.btn-add { background: var(--secondary); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }

.card-body { padding: 0; }
.scrollable { max-height: 75vh; overflow-y: auto; }

.table-container { width: 100%; }
.config-table { width: 100%; border-collapse: collapse; }
.config-table th { text-align: left; padding: 14px 24px; background: #f1f5f9; color: var(--primary); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.config-table td { padding: 12px 24px; border-bottom: 1px solid #f1f5f9; }

.table-input { width: 100%; border: 1px solid transparent; padding: 8px; border-radius: 4px; font-size: 14px; color: var(--primary); font-weight: 500; transition: all 0.2s; }
.table-input:hover { border-color: #e2e8f0; background: #f8fafc; }
.table-input:focus { border-color: var(--secondary); background: #fff; outline: none; box-shadow: 0 0 0 3px rgba(var(--secondary-rgb), 0.1); }

.tag-curso { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: #e0f2fe; color: #0369a1; }

.btn-del-small { background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.4; }
.btn-del-small:hover { opacity: 1; color: #c0392b; }

.empty-list { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

.toast-notification { position: fixed; top: 20px; right: 24px; padding: 12px 20px; border-radius: 12px; z-index: 6000; display: flex; gap: 10px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #22c55e; color: #166534; }
.toast-danger { background: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; color: #991b1b; }
</style>
