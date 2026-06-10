<template>
  <div class="screen-layout">
    <div class="config-module">
      <div class="module-header">
        <h1>🎯 Gestão de Missões</h1>
        <button class="btn-back" @click="router.push('/configuracoes')">← Voltar</button>
      </div>
      <div class="module-body placeholder">
        <p>A tela de gerenciamento de Missões será implementada aqui.</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<style scoped>
.screen-layout { padding: 24px; background: var(--bg-main); min-height: 100vh; }
.config-module { max-width: 1000px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.module-header { padding: 20px 24px; background: var(--primary); color: #fff; display: flex; justify-content: space-between; align-items: center; }
.module-header h1 { font-size: 18px; margin: 0; }
.btn-back { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; }
.placeholder { padding: 60px; text-align: center; color: #64748b; font-style: italic; }
</style>
