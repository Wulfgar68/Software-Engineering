<template>
  <div class="max-w-2xl mx-auto p-4 space-y-3">
    <h2 class="text-xl font-semibold">Razgovori</h2>

    <div v-if="loading" class="text-gray-500">Učitavam…</div>
    <p v-else-if="!chats.length" class="text-gray-500">Nema razgovora.</p>

    <ul v-else class="divide-y rounded border bg-white">
      <li v-for="c in chats" :key="c.id" class="p-3 flex items-center justify-between">
        <div class="min-w-0">
          <RouterLink :to="`/chat/${c.id}`" class="font-medium hover:underline block truncate">
            {{ chatTitle(c) }}
          </RouterLink>
          <div class="text-sm text-gray-600 truncate">
            {{ c.lastMessage || 'Bez poruka' }}
          </div>
        </div>
        <RouterLink :to="`/chat/${c.id}`" class="text-sm px-3 py-1 rounded border hover:bg-gray-50">Otvori</RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed, watch } from 'vue'
import { db } from '@/firebase.js'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import { RouterLink } from 'vue-router'

const auth = useAuthStore()
const uid = computed(() => auth.user?.uid)

const chats = ref([])
const loading = ref(true)
let unsub = null

const start = () => {
  if (unsub) { unsub(); unsub = null }
  chats.value = []
  loading.value = true

  if (!uid.value) { loading.value = false; return }

  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid.value),
    orderBy('updatedAt', 'desc')
  )

  unsub = onSnapshot(q, (snap) => {
    chats.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  }, () => { loading.value = false })
}

watch(uid, () => start(), { immediate: true })
onBeforeUnmount(() => unsub && unsub())

const chatTitle = (c) => {
  const others = (c.participants || []).filter(p => p !== uid.value)
  return `Razgovor s korisnikom ${others[0] || ''}`
}
</script>
