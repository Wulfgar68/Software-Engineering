import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore()
await authStore.initAuth()

app.use(router)
app.mount('#app')