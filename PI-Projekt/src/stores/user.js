import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase.js'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const loading = ref(false)
  const error = ref('')
  let unsub = null

  const isPremium = computed(() => !!profile.value?.isPremium)

  const startProfileListener = () => {
    const auth = useAuthStore()
    const uid = auth.user?.uid
    if (!uid) return

    loading.value = true
    error.value = ''

    if (unsub) unsub()
    unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      profile.value = snap.exists() ? snap.data() : null
      loading.value = false
    }, (e) => {
      error.value = e?.message || 'Greška pri dohvaćanju profila.'
      loading.value = false
    })
  }

  const stopProfileListener = () => {
    if (unsub) unsub()
    unsub = null
  }

  return { profile, loading, error, isPremium, startProfileListener, stopProfileListener }
})
