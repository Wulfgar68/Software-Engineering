<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <header class="border-b bg-white/70 backdrop-blur">
      <div class="max-w-7xl mx-auto px-6 py-6 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <RouterLink to="/users" class="text-sm underline">← natrag na korisnike</RouterLink>
          <h1 class="mt-2 text-3xl font-bold tracking-tight truncate">
            {{ profileTitle }}
          </h1>
          <p class="text-gray-600 truncate">
            {{ profileSubtitle }}
          </p>
        </div>

        <div class="shrink-0">
          <div class="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold">
            {{ profileInitials }}
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div v-if="loadingProfile" class="text-gray-500">Učitavam profil…</div>
      <div v-else-if="profileError" class="text-red-600">{{ profileError }}</div>

      <div v-else class="bg-white border rounded-2xl p-4 shadow-sm">
        <div class="grid gap-2 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <span class="text-gray-500">Ime:</span>
            <b class="ml-1">{{ profile?.fullName || '-' }}</b>
          </div>
          <div>
            <span class="text-gray-500">Username:</span>
            <b class="ml-1">{{ profile?.username ? '@' + profile.username : '-' }}</b>
          </div>
          <div>
            <span class="text-gray-500">Email:</span>
            <b class="ml-1">{{ MojProfil ? (profile?.email || '-') : '-' }}</b>
          </div>
        </div>
      </div>

      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">📚 Knjige korisnika</h2>
          <span class="text-sm text-gray-500" v-if="books.length">{{ books.length }} kom.</span>
        </div>

        <div v-if="loadingBooks" class="text-gray-500">Učitavam knjige…</div>
        <div v-else-if="booksError" class="text-red-600">{{ booksError }}</div>

        <div v-else>
          <div v-if="books.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="b in books" :key="b.id">
              <BookCard :book="b" />
            </div>
          </div>
          <p v-else class="text-gray-500">Korisnik još nema objavljenih knjiga.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase.js'
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import BookCard from '@/components/Knjige/BookCard.vue'

const props = defineProps({
  uid: { type: String, required: true }
})

const auth = useAuthStore()
const MojProfil = computed(() => auth.user?.uid === props.uid)

const profile = ref(null)
const loadingProfile = ref(true)
const profileError = ref('')

const books = ref([])
const loadingBooks = ref(true)
const booksError = ref('')

let unsubBooks = null

console.log('route uid', props.uid)
console.log('auth user', auth.user)

const loadProfile = async (uid) => {
  loadingProfile.value = true
  profileError.value = ''
  profile.value = null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      profile.value = snap.data()
    } else {
      profileError.value = 'Korisnik nije pronađen.'
    }
  } catch (e) {
    profileError.value = e?.message || 'Greška pri dohvaćanju profila.'
  } finally {
    loadingProfile.value = false
  }
}

const subBooks = (uid) => {
  if (unsubBooks) { unsubBooks(); unsubBooks = null }
  loadingBooks.value = true
  booksError.value = ''
  books.value = []

  try {
    const qBooks = query(
      collection(db, 'books'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )

    unsubBooks = onSnapshot(qBooks, (snap) => {
      books.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loadingBooks.value = false
      booksError.value = ''
    }, (e) => {
      loadingBooks.value = false
      booksError.value = e?.message || 'Greška pri dohvaćanju knjiga.'
    })
  } catch (e) {
    loadingBooks.value = false
    booksError.value = e?.message || 'Greška pri dohvaćanju knjiga.'
  }
}

onMounted(async () => {
  await loadProfile(props.uid)
  subBooks(props.uid)
})

watch(() => props.uid, async (newUid) => {
  await loadProfile(newUid)
  subBooks(newUid)
})

onBeforeUnmount(() => { if (unsubBooks) unsubBooks() })

const displayName = computed(() => {
  const u = profile.value || {}
  return u.fullName || u.username || u.firstName || (u.email ? u.email.split('@')[0] : '') || props.uid
})

const profileTitle = computed(() => displayName.value)

const profileSubtitle = computed(() => {
  const u = profile.value || {}
  if (u.username) return `@${u.username}`
  if (u.email) return u.email
  return ''
})

const profileInitials = computed(() => {
  const name = String(displayName.value || '').trim()
  if (!name) return 'U'
  const parts = name.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || 'U'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
})
</script>
