<template>
  <nav class="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
    <div class="font-bold text-lg">EduLib</div>
    <div>
      <router-link to="/marketplace" class="mr-4">Tržnica</router-link>
      <router-link v-if="user" to="/profile" class="mr-4">Profil</router-link>
      <router-link v-if="!user" to="/login" class="mr-4">Prijava</router-link>
      <router-link v-if="!user" to="/register" class="mr-4">Registracija</router-link>
      <router-link v-if="user" to="/favorites" class="mr-4">Favoriti</router-link>
      <button v-if="user" @click="logout" class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded">Odjava</button>
    </div>
  </nav>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
