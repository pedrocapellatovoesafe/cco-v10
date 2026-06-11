<template>
  <div class="topbar">
    <div class="title-section">
      <img :src="iconUrl" alt="SAFE" />
      <h1>{{ store.state.editorTitle }}</h1>
    </div>
    
    <div class="date-filters">
      <div class="filter-field">
        <label>Início:</label>
        <input type="date" v-model="store.filterStartDate.value" class="date-input" />
      </div>
      <div class="filter-field">
        <label>Fim:</label>
        <input type="date" v-model="store.filterEndDate.value" class="date-input" />
      </div>
      <button class="btn-filter" @click="$emit('filter')">🔍 Filtrar</button>
    </div>

    <!-- Desktop Controls -->
    <div class="controls desktop-only">
      <button class="btn-back" @click="$emit('open-calendar')">📅 Calendário</button>
      <!-- <button class="btn-back" @click="() => router.push('/restricoes')">🛠️ Restrições</button> -->
      <!-- <button class="btn-back" @click="() => router.push('/aeronaves')">✈️ Aeronaves</button> -->
      <button class="btn-back" @click="() => router.push('/upload')">📂 Base de dados</button>
      <button class="btn-back" @click="() => router.push('/configuracoes')">⚙️ Configurações</button>
      <button class="btn-logout-editor" @click="$emit('logout')">Sair</button>
    </div>

    <!-- Mobile Controls (Dropdown) -->
    <div class="controls mobile-only">
      <div class="dropdown" ref="dropdownRef">
        <button class="btn-dropdown-toggle" @click="toggleMenu">
          <span v-if="!menuOpen">☰ Menu</span>
          <span v-else>✕ Fechar</span>
        </button>
        <div v-if="menuOpen" class="dropdown-menu">
          <button class="dropdown-item" @click="handleAction('open-calendar')">📅 Calendário</button>
          <button class="dropdown-item" @click="handleAction('/upload')">📂 Base de dados</button>
          <button class="dropdown-item" @click="handleAction('/configuracoes')">⚙️ Configurações</button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item btn-logout-mobile" @click="handleAction('logout')">Sair</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const emit = defineEmits(['filter', 'open-calendar', 'logout'])

const menuOpen = ref(false)
const dropdownRef = ref(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleAction(action) {
  menuOpen.value = false
  if (action === 'open-calendar') emit('open-calendar')
  else if (action === 'logout') emit('logout')
  else router.push(action)
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.topbar {
  display: flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;
  gap: 16px; padding: 10px 18px; background: #fff; border: 1px solid #dae2ec; border-radius: 14px;
  box-shadow: 0 8px 24px rgba(14, 38, 72, 0.06);
}
.title-section { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.title-section img { width: 26px; height: 28px; border-radius: 50%; opacity: 0.9; }
.topbar h1 { font-size: 13.5px; font-weight: 700; color: var(--primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.date-filters {
  display: flex; align-items: center; gap: 8px; background: #f8f9fa;
  padding: 4px 10px; border-radius: 10px; border: 1px solid #e3e9f0;
  flex: 0 0 auto;
}
.filter-field { display: flex; align-items: center; gap: 4px; }
.filter-field label { font-size: 10.5px; font-weight: 700; color: #5a6370; text-transform: uppercase; }
.date-input { border: 1px solid #d8dee8; border-radius: 6px; padding: 3px 6px; font-size: 11.5px; color: var(--primary); width: 110px; }
.btn-filter { background: var(--primary); color: #fff; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; }

.controls { 
  display: flex; 
  flex-flow: row nowrap; 
  align-items: center; 
  justify-content: flex-end; 
  gap: 5px; 
  flex: 1; 
}
.btn-back, .btn-logout-editor {
  border: none; border-radius: 8px; padding: 6px 9px; font-size: 10.5px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  flex-shrink: 0;
}
.btn-back { background: var(--primary); color: #fff; }
.btn-logout-editor { background: #c0392b; color: #fff; }

/* Responsive Logic */
.mobile-only { display: none; }

@media (max-width: 1024px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
}

@media (max-width: 768px) {
  .topbar { flex-wrap: wrap; gap: 10px; }
  .title-section { flex: 1 1 100%; order: 1; }
  .date-filters { flex: 1 1 auto; order: 2; }
  .mobile-only { order: 3; }
}

/* Dropdown Styles */
.dropdown { position: relative; }
.btn-dropdown-toggle {
  background: var(--primary); color: #fff; border: none; border-radius: 8px;
  padding: 8px 12px; font-size: 11px; font-weight: 700; cursor: pointer;
}
.dropdown-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: #fff; border: 1px solid #e3e9f0; border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000;
  min-width: 180px; padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.dropdown-item {
  background: none; border: none; padding: 10px 14px; text-align: left;
  font-size: 12px; font-weight: 600; color: #334155; border-radius: 6px;
  cursor: pointer; transition: all 0.2s;
}
.dropdown-item:hover { background: #f1f5f9; color: var(--primary); }
.dropdown-divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
.btn-logout-mobile { color: #c0392b; }
.btn-logout-mobile:hover { background: #fee2e2; color: #991b1b; }
</style>
