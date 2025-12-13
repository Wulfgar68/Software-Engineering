<template>
  <div class="max-w-6xl mx-auto p-6 space-y-8">
    <h1 class="text-2xl font-semibold">Favoriti</h1>

    <div v-if="loading" class="text-gray-500">Učitavam…</div>
    <div v-if="error" class="text-red-600">{{ error }}</div>

    <!-- Moje knjige u favoritima -->
    <section>
      <h3 class="text-xl font-bold mb-3">📚 Moje knjige</h3>
      <div v-if="myFavBooks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="book in myFavBooks" :key="book.id">
          <BookCard :book="book" /> <!-- gumb za favorite je već u BookCard -->
        </div>
      </div>
      <p v-else class="text-gray-500">Nema mojih knjiga u favoritima.</p>
    </section>

    <!-- Tuđe knjige u favoritima -->
    <section>
      <h3 class="text-xl font-bold mb-3">🔍 Knjige drugih korisnika</h3>
      <div v-if="otherFavBooks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="book in otherFavBooks" :key="book.id">
          <BookCard :book="book" />
        </div>
      </div>
      <p v-else class="text-gray-500">Nema tuđih knjiga u favoritima.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { db } from '@/firebase.js'
import { collection, query, where, onSnapshot, getDocs, documentId } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import { storeToRefs } from 'pinia'
import BookCard from '@/components/Knjige/BookCard.vue'

const { user } = storeToRefs(useAuthStore())

const loading = ref(true)
const error = ref('')

const favBooks = ref([])  // svi book dokumenti koji su u favoritima
let unsubFavs = null

// helper za 'in' upite (max 10 ID-a po upitu)
const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// realtime na moje favorite → dohvat book dokumenata u batch-evima
const load = () => {
  const uid = user.value?.uid
  if (!uid) { loading.value = false; return }

  const favQ = query(collection(db, 'favorites'), where('userId', '==', uid))
  unsubFavs = onSnapshot(favQ, async (snap) => {
    try {
      const ids = snap.docs.map(d => d.data().bookId).filter(Boolean)
      if (!ids.length) { favBooks.value = []; loading.value = false; return }

      const parts = chunk(ids, 10)
      const all = []
      for (const p of parts) {
        const q = query(collection(db, 'books'), where(documentId(), 'in', p))
        const res = await getDocs(q)
        res.forEach(doc => all.push({ id: doc.id, ...doc.data() }))
      }
      // najnovije prve po createdAt
      favBooks.value = all.sort((a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      )
      loading.value = false
      error.value = ''
    } catch (e) {
      console.error(e)
      error.value = 'Greška pri dohvaćanju favorita.'
      loading.value = false
    }
  }, (e) => {
    console.error(e)
    error.value = 'Greška pri dohvaćanju favorita.'
    loading.value = false
  })
}
load()

onBeforeUnmount(() => unsubFavs && unsubFavs())

// podjela na moje i tuđe po vlasniku knjige
const myFavBooks = computed(() => favBooks.value.filter(b => b.userId === user.value?.uid))
const otherFavBooks = computed(() => favBooks.value.filter(b => b.userId !== user.value?.uid))
</script>
