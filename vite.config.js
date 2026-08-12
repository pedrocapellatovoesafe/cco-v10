import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/cco-v10/',
  plugins: [vue()],
  server: {
    port: 5173,
  }
})
