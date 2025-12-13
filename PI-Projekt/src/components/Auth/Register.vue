<template>
  <div class="max-w-md mx-auto mt-10 p-6 border rounded-lg space-y-4">
    <h2 class="text-2xl font-bold">Registracija</h2>

    <form @submit.prevent="onSubmit" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <input v-model.trim="firstName" type="text" placeholder="Ime" class="border rounded px-3 py-2" required />
        <input v-model.trim="lastName"  type="text" placeholder="Prezime" class="border rounded px-3 py-2" required />
      </div>

      <input v-model.trim="email" type="email" placeholder="Email" class="border rounded px-3 py-2 w-full" required />
      <input v-model="password" type="password" placeholder="Lozinka" class="border rounded px-3 py-2 w-full" required />

      <button :disabled="loading" class="w-full bg-black text-white rounded px-4 py-2">
        {{ loading ? 'Kreiram...' : 'Registriraj se' }}
      </button>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const firstName = ref('')
const lastName  = ref('')
const email     = ref('')
const password  = ref('')

const loading = ref(false)
const error   = ref('')
const router  = useRouter()
const auth    = useAuthStore()

const onSubmit = async () => {
  error.value = ''
  loading.value = true
  try {
    await auth.register(email.value, password.value, firstName.value, lastName.value)
    router.push('/profile')
  } catch (e) {
    error.value = e?.message || 'Greška pri registraciji.'
  } finally {
    loading.value = false
  }
}
</script>
