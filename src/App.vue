<template>
  <div class="app-root">
    <router-view />
    <GlobalModal />
  </div>
</template>

<script setup>
import GlobalModal from './components/GlobalModal.vue'
// Root component
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: #f0f4f8;
}
</style>
