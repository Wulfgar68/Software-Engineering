<script setup>
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import ChatDock from '@/components/Chat/ChatDock.vue'

import { db } from '@/firebase.js'
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc
} from 'firebase/firestore'

const router = useRouter()
const authStore = useAuthStore()

// init auth na mount
onMounted(async () => {
  await authStore.initAuth()
})

// --- Dock state ---
const dockOpen = ref(false)
const chats = ref([])          // [{ id, otherUserName, updatedAt, lastMessage }]
let unsub = null

// dohvat display imena
const getNameFor = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      const u = snap.data()
      return u.name || u.displayName || u.fullName || u.email || uid
    }
  } catch {}
  return uid
}

// subscribe na moje razgovore (participant + orderBy updatedAt)
watchEffect(async () => {
  if (unsub) { unsub(); unsub = null }
  chats.value = []

  const me = authStore.user?.uid
  if (!me) return

  const qChats = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', me),
    orderBy('updatedAt', 'desc')
  )

  unsub = onSnapshot(qChats, async (snap) => {
    const arr = []
    for (const d of snap.docs) {
      const data = d.data()
      const otherUid = (data.participants || []).find(p => p !== me)
      arr.push({
        id: d.id,
        otherUserName: await getNameFor(otherUid),
        updatedAt: data.updatedAt,
        lastMessage: data.lastMessage || ''
      })
    }
    chats.value = arr
  })
})

onBeforeUnmount(() => { if (unsub) unsub() })

const openChat = (chatId) => {
  dockOpen.value = false
  router.push(`/chat/${chatId}`)
}
const openBot = () => {
  dockOpen.value = false
  router.push('/chatbot')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NavBar />
    <main class="flex-1 pb-8">
      <router-view />
    </main>
    <Footer />

    <!-- FAB -->
    <button
      @click="dockOpen = !dockOpen"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition z-50"
      title="Poruke"
    >
      💬
    </button>

    <!-- Dock -->
    <ChatDock
      v-if="dockOpen"
      :chats="chats"
      @close="dockOpen=false"
      @open-chat="openChat"
      @open-chatbot="openBot"
    />
  </div>
</template>
