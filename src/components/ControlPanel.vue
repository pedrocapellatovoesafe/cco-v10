<template>
  <section class="card">
    <h1 class="title">Central de Controle Operacional</h1>
    <p class="subtitle">
      Uma interface Vue.js simples para manter a tipografia e a lógica presentes no seu projeto.
    </p>

    <div class="grid">
      <InfoCard title="Visão geral">
        Use os dados abaixo para exibir conteúdo dinâmico, formulários ou indicadores de status.
      </InfoCard>

      <InfoCard title="Status">
        <p>
          <span class="highlight">{{ status }}</span>
        </p>
      </InfoCard>
    </div>

    <div class="actions">
      <button @click="toggleStatus">Alternar Status</button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import InfoCard from './InfoCard.vue'

const status = ref('Operacional')

function toggleStatus() {
  status.value = status.value === 'Operacional' ? 'Atenção necessária' : 'Operacional'
}
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 960px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  padding: 36px;
}
.title {
  margin: 0 0 16px;
  font-size: 2.4rem;
  line-height: 1.1;
  color: #111827;
}
.subtitle {
  margin: 0 0 24px;
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.75;
}
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.actions {
  margin-top: 28px;
}
button {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
}
button:hover {
  background: #1d4ed8;
}
.highlight {
  color: #2563eb;
  font-weight: 700;
}
</style>
