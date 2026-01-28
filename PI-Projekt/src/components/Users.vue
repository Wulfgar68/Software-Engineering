<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <header class="border-b bg-white/70 backdrop-blur">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <h1 class="text-3xl font-bold tracking-tight">Korisnici</h1>
        <p class="text-gray-600">Pretraži profile i pogledaj njihove knjige.</p>

        <div class="mt-4">
          <input
            v-model.trim="q"
            type="text"
            placeholder="Pretraži po imenu, username-u ili emailu…"
            class="w-full md:w-[560px] border rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <div v-if="loading" class="text-gray-500">Učitavam…</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>

      <div v-else class="space-y-4">
        <div class="text-sm text-gray-600">
          Pronađeno: <b>{{ filtered.length }}</b>
        </div>

        <div v-if="!filtered.length" class="text-gray-500">
          Nema rezultata za upit.
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="u in filtered"
            :key="u.id"
            :to="`/user/${u.id}`"
            class="group border rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                {{ initials(u) }}
              </div>

              <div class="min-w-0">
                <div class="font-semibold truncate group-hover:underline">
                  {{ displayName(u) }}
                </div>
                <div class="text-sm text-gray-600 truncate">
                  {{ secondaryLine(u) }}
                </div>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase.js'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

const q = ref('')
const loading = ref(true)
const error = ref('')
const users = ref([]) // [{ id, ...data }]

let unsub = null

onMounted(() => {
  try {
    const qUsers = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(60)
    )

    unsub = onSnapshot(qUsers, (snap) => {
      users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
      error.value = ''
    }, (e) => {
      loading.value = false
      error.value = e?.message || 'Greška pri dohvaćanju korisnika.'
    })
  } catch (e) {
    loading.value = false
    error.value = e?.message || 'Greška pri dohvaćanju korisnika.'
  }
})

onBeforeUnmount(() => { if (unsub) unsub() })

const norm = (s) => String(s || '').toLowerCase()

const displayName = (u) => {
  return u.fullName || u.username || u.firstName || (u.email ? u.email.split('@')[0] : '') || u.id
}

const secondaryLine = (u) => {
  if (u.username) return `@${u.username}`
  if (u.email) return u.email
  return ''
}

const initials = (u) => {
  const name = displayName(u).trim()
  if (!name) return 'U'
  const parts = name.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || 'U'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
}

const filtered = computed(() => {
  const needle = norm(q.value)
  const me = authStore.user?.uid

  const base = users.value.filter(u => u.id !== me)

  if (!needle) return base

  return base.filter(u => {
    const hay = [
      u.fullName,
      u.username,
      u.firstName,
      u.lastName,
      u.email,
    ].map(norm).join(' ')
    return hay.includes(needle)
  })
})
</script>
