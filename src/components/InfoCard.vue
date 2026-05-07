<template>
  <div class="box">
    <h2>{{ title }}</h2>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.box {
  background: #f8fafc;
  border-radius: 18px;
  padding: 20px;
}
.box h2 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #111827;
}
.content {
  color: #475569;
  line-height: 1.75;
}
</style>
