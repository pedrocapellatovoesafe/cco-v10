import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useCcoStore } from './composables/useCcoStore'
import './assets/style.css'

const app = createApp(App)
const store = useCcoStore()

app.provide('store', store)
app.use(router)
app.mount('#app')
