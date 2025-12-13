<template>
  <div class="max-w-3xl mx-auto h-[calc(100vh-160px)] p-4 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <RouterLink to="/marketplace" class="text-sm underline">← natrag</RouterLink>
      <h2 class="text-xl font-semibold truncate">
        {{ otherDisplayName || 'Razgovor' }}
      </h2>
      <div></div>
    </div>

    <!-- Poruke -->
    <div ref="scrollArea" class="flex-1 overflow-y-auto border rounded bg-white p-3 space-y-2">
      <div v-if="loading" class="text-gray-500">Učitavam…</div>
      <div v-else-if="!messages.length" class="text-gray-500">Nema poruka. Napiši prvu!</div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="max-w-[75%] px-3 py-2 rounded"
        :class="m.senderId === me ? 'ml-auto bg-black text-white' : 'mr-auto bg-gray-100'"
      >
        <div class="whitespace-pre-line break-words">{{ m.text }}</div>
        <div class="text-[11px] opacity-70 mt-1">{{ humanDate(m.createdAt) }}</div>
      </div>
    </div>

    <!-- Input -->
    <form @submit.prevent="onSend" class="mt-3 flex gap-2">
      <input
        ref="inputRef"
        v-model="draft"
        type="text"
        placeholder="Upišite poruku…"
        class="flex-1 border rounded px-3 py-2"
      />
      <button class="px-4 py-2 rounded bg-black text-white">Pošalji</button>
    </form>

    <p v-if="error" class="mt-2 text-red-600 text-sm">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { subscribeMessages, sendMessage } from '@/utils/chat.js'
import { db } from '@/firebase.js'
import { doc, getDoc } from 'firebase/firestore'

const auth = useAuthStore()
const me = computed(() => auth.user?.uid)

const route = useRoute()

const chatId = ref('')
const otherUid = ref('')
const otherDisplayName = ref('')

const messages = ref([])
const loading = ref(true)
const error = ref('')
const draft = ref('')

const scrollArea = ref(null)
const inputRef = ref(null)
let unsub = null

const scrollToBottom = async () => {
  await nextTick()
  const el = scrollArea.value
  if (el) el.scrollTop = el.scrollHeight
}

// chatId je formata: "manjiUID_veciUID"
const resolveParticipants = () => {
  const id = String(route.params.id || '').trim()     // ⟵ MORA biti "id" (malo i)
  chatId.value = id
  const [a, b] = id.split('_')
  otherUid.value = me.value === a ? b : a
}

const loadOtherName = async () => {
  otherDisplayName.value = ''
  if (!otherUid.value) return
  try {
    const uref = doc(db, 'users', otherUid.value)
    const snap = await getDoc(uref)
    if (snap.exists()) {
      const u = snap.data()
      otherDisplayName.value =
        u.fullName || u.username || u.firstName || u.email?.split('@')[0] || 'Korisnik'
    }
  } catch {
    /* ignore */
  }
}

const startSubscribe = () => {
  if (unsub) { unsub(); unsub = null }
  messages.value = []
  loading.value = true
  error.value = ''

  if (!chatId.value) {
    loading.value = false
    error.value = 'Neispravan chat ID.'
    return
  }

  unsub = subscribeMessages(
    chatId.value,
    (snap) => {
      messages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
      scrollToBottom()
    },
    (e) => { error.value = e?.message || 'Greška'; loading.value = false }
  )
}

onMounted(async () => {
  resolveParticipants()
  await loadOtherName()
  startSubscribe()

  nextTick(() => inputRef.value?.focus())
})

onBeforeUnmount(() => { if (unsub) unsub() })

watch(() => route.params.id, async () => {
  resolveParticipants()
  await loadOtherName()
  startSubscribe()
})

const onSend = async () => {
  if (!me.value) { error.value = 'Prijavi se.'; return }
  if (!chatId.value) { error.value = 'Neispravan chat ID.'; return }
  try {
    await sendMessage(chatId.value, me.value, draft.value)
    draft.value = ''
    await scrollToBottom()
    inputRef.value?.focus()
  } catch (e) {
    console.error('sendMessage error:', e)
    error.value = e?.message || 'Greška pri slanju.'
  }
}

const humanDate = (ts) => {
  try {
    const d = ts?.toDate?.() ?? new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}
</script>
