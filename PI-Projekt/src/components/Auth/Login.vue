<template>
  <div class="max-w-md mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Prijava</h1>

    <form @submit.prevent="onSubmit" class="space-y-3">
      <input v-model.trim="email" type="email" placeholder="Email"
             class="w-full border rounded px-3 py-2" required />
      <input v-model.trim="password" type="password" placeholder="Lozinka"
             class="w-full border rounded px-3 py-2" required />
      <button :disabled="loading" class="w-full rounded px-3 py-2 border"
              :class="loading ? 'opacity-60 cursor-not-allowed' : 'bg-black text-white'">
        {{ loading ? 'Prijavljujem...' : 'Prijavi se' }}
      </button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>

    <p class="text-sm mt-3">
      Nemaš račun?
      <RouterLink to="/register" class="underline">Registriraj se</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const onSubmit = async () => {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/profile')
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Greška pri prijavi'
  } finally {
    loading.value = false
  }
}
</script>
