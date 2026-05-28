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

    <div class="controls">
      <button class="btn-back" @click="$emit('open-calendar')">📅 Calendário</button>
      <button class="btn-back" @click="() => router.push('/restricoes')">🛠️ Restrições</button>
      <button class="btn-back" @click="() => router.push('/aeronaves')">✈️ Aeronaves</button>
      <button class="btn-back" @click="() => router.push('/upload')">📂 Base de dados</button>
      <button class="btn-logout-editor" @click="$emit('logout')">Sair</button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
defineEmits(['filter', 'open-calendar', 'logout'])
</script>

<style scoped>
.topbar {
  display: flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;
  gap: 16px; padding: 10px 18px; background: #fff; border: 1px solid #dae2ec; border-radius: 14px;
  box-shadow: 0 8px 24px rgba(14, 38, 72, 0.06);
}
.title-section { display: flex; align-items: center; gap: 8px; flex: 1; }
.title-section img { width: 26px; height: 28px; border-radius: 50%; opacity: 0.9; }
.topbar h1 { font-size: 13.5px; font-weight: 700; color: var(--primary); margin: 0; white-space: nowrap; }

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
</style>
