<template>
  <div class="app-root">
    <router-view :key="$route.path" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: #f0f4f8;
}
</style>
