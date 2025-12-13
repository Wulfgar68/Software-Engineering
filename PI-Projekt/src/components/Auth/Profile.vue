<template>
  <div class="max-w-xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Moj profil</h1>

    <!-- OSNOVNI PODACI -->
    <div class="rounded border p-4 space-y-2 bg-white">
      <div class="text-sm text-gray-600">Ime i prezime</div>
      <div>{{ profile?.fullName || '-' }}</div>

      <div class="text-sm text-gray-600">Email</div>
      <div>{{ user?.email }}</div>
    </div>

    <!-- AKCIJE -->
    <div class="flex flex-wrap gap-3">
      <RouterLink to="/dodaj_knjigu" class="rounded px-3 py-2 bg-black text-white">
        Dodaj knjigu
      </RouterLink>

      <button
        type="button"
        class="rounded px-3 py-2 border hover:bg-gray-50"
        @click="openPwModal = true"
      >
        Promijeni lozinku
      </button>

      <button @click="onLogout" class="rounded px-3 py-2 border">
        Odjava
      </button>
    </div>

    <!-- MODAL: PROMJENA LOZINKE -->
    <div v-if="openPwModal" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <div
        class="absolute left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2
               bg-white rounded-2xl shadow-2xl border overflow-hidden"
      >
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <h2 class="font-semibold">Promjena lozinke</h2>
          <button class="text-gray-500 hover:text-black" @click="closeModal">✕</button>
        </div>

        <div class="p-4 space-y-3">
          <form @submit.prevent="onChangePw" class="space-y-3">
            <input
              v-model="currentPw"
              type="password"
              placeholder="Trenutna lozinka"
              class="w-full border rounded px-3 py-2"
              required
            />
            <input
              v-model="newPw"
              type="password"
              placeholder="Nova lozinka"
              class="w-full border rounded px-3 py-2"
              minlength="6"
              required
            />
            <input
              v-model="newPw2"
              type="password"
              placeholder="Potvrdi novu lozinku"
              class="w-full border rounded px-3 py-2"
              minlength="6"
              required
            />
            <div class="flex items-center gap-2">
              <button
                class="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
                :disabled="busy"
              >
                Spremi
              </button>
              <button
                type="button"
                class="text-sm underline disabled:opacity-60"
                :disabled="busy || !user?.email"
                @click="onResetEmail"
              >
                Pošalji email za reset
              </button>
            </div>
          </form>
          <p v-if="msg" class="text-green-600 text-sm">{{ msg }}</p>
          <p v-if="err" class="text-red-600 text-sm">{{ err }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase.js'

const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)

const profile = ref(null)
const openPwModal = ref(false)
const currentPw = ref('')
const newPw = ref('')
const newPw2 = ref('')
const busy = ref(false)
const msg = ref('')
const err = ref('')

onMounted(async () => {
  if (user.value?.uid) {
    const snap = await getDoc(doc(db, 'users', user.value.uid))
    if (snap.exists()) profile.value = snap.data()
  }
})

const closeModal = () => {
  openPwModal.value = false
  msg.value = ''
  err.value = ''
  currentPw.value = ''
  newPw.value = ''
  newPw2.value = ''
}

const onChangePw = async () => {
  if (newPw.value !== newPw2.value) {
    err.value = 'Nova lozinka i potvrda moraju biti iste.'
    return
  }
  if (newPw.value.length < 6) {
    err.value = 'Lozinka mora imati barem 6 znakova.'
    return
  }

  try {
    busy.value = true
    await auth.changePassword(currentPw.value, newPw.value)
    msg.value = 'Lozinka promijenjena.'
    setTimeout(closeModal, 800)
  } catch (e) {
    err.value = e?.message || 'Greška pri promjeni lozinke.'
  } finally {
    busy.value = false
  }
}

const onResetEmail = async () => {
  try {
    busy.value = true
    await auth.sendPasswordReset(user.value.email)
    msg.value = 'Poslan email za reset lozinke.'
  } catch (e) {
    err.value = e?.message || 'Ne mogu poslati email.'
  } finally {
    busy.value = false
  }
}

const onLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
:global(body) {
  overscroll-behavior: contain;
}
</style>
