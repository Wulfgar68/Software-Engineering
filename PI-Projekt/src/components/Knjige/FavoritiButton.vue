<template>
  <div>
    <button
      :disabled="!me || busy"
      @click="toggle"
      class="px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-60"
      :title="!me ? 'Prijavite se za favorite' : (isFav ? 'Ukloni iz favorita' : 'Dodaj u favorite')"
    >
      <span v-if="isFav">★ U favoritima</span>
      <span v-else>☆ Dodaj u favorite</span>
    </button>
    <p v-if="err" class="text-xs text-red-600 mt-1">{{ err }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { db } from '@/firebase.js'
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

const props = defineProps({ bookId: { type: String, required: true } })

const auth = useAuthStore()
const me = computed(() => auth.user?.uid)

const favId = computed(() => (me.value ? `${me.value}_${props.bookId}` : null))
const isFav = ref(false)
const busy = ref(false)
const err = ref('')
let unsub = null

function resubscribe() {
  if (unsub) { unsub(); unsub = null }
  isFav.value = false
  err.value = ''
  if (!favId.value) return

  const refDoc = doc(db, 'favorites', favId.value)
  unsub = onSnapshot(refDoc, snap => {
    isFav.value = snap.exists()
  }, e => {
    console.error('fav onSnapshot error:', e)
    err.value = e?.message || 'Greška pristupa favoritima.'
  })
}

watch([me, () => props.bookId], resubscribe, { immediate: true })
onBeforeUnmount(() => { if (unsub) unsub() })

const toggle = async () => {
  err.value = ''
  if (!me.value || !favId.value) return
  busy.value = true
  try {
    const refDoc = doc(db, 'favorites', favId.value)
    if (isFav.value) {
      await deleteDoc(refDoc)
    } else {
      await setDoc(refDoc, {
        userId: me.value,
        bookId: props.bookId,
        createdAt: serverTimestamp()
      }, { merge: false })
    }
  } catch (e) {
    console.error('Favorit toggle error:', e)
    err.value = e?.message || 'Greška pri spremanju favorita.'
  } finally {
    busy.value = false
  }
}
</script>
