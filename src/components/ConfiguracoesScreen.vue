<template>
  <div class="screen-layout">
    <div class="config-screen">
      <div class="config-header">
        <div class="title-area">
          <h1>⚙️ Configurações do Sistema</h1>
          <p>Gerencie os cadastros base, parâmetros e regras do CCO</p>
        </div>
        <div class="header-actions">
          <button class="btn-back" @click="handleBackToEditor">← Voltar ao Editor</button>
          <button class="btn-logout" @click="handleLogout">Sair</button>
        </div>
      </div>

      <div class="config-grid">
        <div v-for="item in configItems" :key="item.id" class="config-card" @click="navigateTo(item.route)">
          <div class="card-icon">{{ item.icon }}</div>
          <div class="card-info">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <div class="footer">
        <span>CCO · Sistema de Configurações v1.0 · SAFE Aviation School</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = inject('store')

const configItems = [
  {
    id: 'instrutores',
    title: 'Instrutores',
    description: 'Gerenciar instrutores de voo e solo, bases e qualificações.',
    icon: '👨‍✈️',
    route: '/configuracoes/instrutores'
  },
  {
    id: 'aeronaves',
    title: 'Aeronaves',
    description: 'Cadastrar e editar aeronaves, modelos e disponibilidades.',
    icon: '✈️',
    route: '/aeronaves' // Reusing existing screen for now
  },
  {
    id: 'barras',
    title: 'Barras (Slots)',
    description: 'Configurar os horários e períodos de operação por base.',
    icon: '📊',
    route: '/configuracoes/barras'
  },
  {
    id: 'cursos',
    title: 'Cursos',
    description: 'Gerenciar os cursos oferecidos pela escola.',
    icon: '📚',
    route: '/configuracoes/cursos'
  },
  {
    id: 'restricoes',
    title: 'Restrições',
    description: 'Gerenciar regras de restrição entre instrutores, aeronaves e missões.',
    icon: '🛠️',
    route: '/restricoes' // Reusing existing screen
  },
  {
    id: 'usuarios',
    title: 'Usuários',
    description: 'Controle de acesso e permissões do sistema.',
    icon: '👥',
    route: '/configuracoes/usuarios'
  }
]

function handleBackToEditor() {
  router.push('/editor')
}

function handleLogout() {
  store.logout()
  router.push('/login')
}

function navigateTo(route) {
  router.push(route)
}
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-main);
}
.config-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary);
  color: #fff;
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-bottom: 4px solid var(--secondary);
}
.title-area h1 { font-size: 22px; font-weight: 800; margin: 0; font-family: var(--font-title); text-transform: uppercase; }
.title-area p { margin: 6px 0 0; font-size: 14px; opacity: 0.8; }

.header-actions { display: flex; gap: 12px; }
.btn-back, .btn-logout {
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
.btn-back:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.btn-logout { background: #c0392b; border: none; }

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.config-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #dae2ec;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.config-card:hover {
  transform: translateY(-4px);
  border-color: var(--secondary);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
}

.config-card:hover .card-arrow {
  transform: translateX(4px);
  color: var(--secondary);
}

.card-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  background: #f8fafc;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
}

.card-info p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.card-arrow {
  font-size: 20px;
  color: #cbd5e1;
  transition: all 0.2s;
}

.footer {
  margin-top: 12px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  padding: 12px;
}

@media (max-width: 640px) {
  .config-grid { grid-template-columns: 1fr; }
  .config-header { flex-direction: column; text-align: center; gap: 20px; padding: 24px; }
  .header-actions { width: 100%; justify-content: center; }
}
</style>
