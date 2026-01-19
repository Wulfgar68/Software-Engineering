<template>
  <nav class="bg-gray-800 text-white">
<div class="w-full px-8 py-3 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <router-link to="/marketplace" class="font-bold text-lg tracking-tight">
          EduLib
        </router-link>

        <div class="flex items-center gap-4">
          <router-link to="/marketplace" class="hover:underline">Tržnica</router-link>
          <router-link to="/users" class="hover:underline">Korisnici</router-link>
        </div>
      </div>

      <!-- RIGHT: user area -->
      <div class="flex items-center gap-4">
        <template v-if="user">
          <div class="flex items-center gap-2">
            <router-link to="/profile" class="hover:underline">Profil</router-link>

            <span
              v-if="userStore.isPremium"
              class="text-[11px] leading-none px-2 py-1 rounded-full bg-white/10 text-white/90 border border-white/15"
            >
              PREMIUM
            </span>
          </div>

          <router-link to="/favorites" class="hover:underline">Favoriti</router-link>

          <button
            @click="logout"
            class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
          >
            Odjava
          </button>
        </template>

        <template v-else>
          <router-link to="/login" class="hover:underline">Prijava</router-link>
          <router-link to="/register" class="hover:underline">Registracija</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>


<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'

const userStore = useUserStore()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
