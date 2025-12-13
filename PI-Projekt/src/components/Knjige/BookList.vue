<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { db } from '@/firebase.js'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import { storeToRefs } from 'pinia'

// kartica i favorit gumb
import BookCard from '@/components/Knjige/BookCard.vue'
import FavoritiButton from '@/components/Knjige/FavoritiButton.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const myBooks = ref([])
const otherBooks = ref([])
const loading = ref(true)
const error = ref('')

let unsubMine = null
let unsubOthers = null

watch(user, (u) => {
  // počisti stare subscriptione
  if (unsubMine) { unsubMine(); unsubMine = null }
  if (unsubOthers) { unsubOthers(); unsubOthers = null }
  myBooks.value = []
  otherBooks.value = []
  loading.value = true
  error.value = ''

  // 1) Moje knjige (po mom UID-u), najnovije prve
  if (u?.uid) {
    const qMine = query(
      collection(db, 'books'),
      where('userId', '==', u.uid),
      orderBy('createdAt', 'desc')
    )
    unsubMine = onSnapshot(qMine, (snap) => {
      myBooks.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, (err) => {
      console.error(err)
      error.value = 'Greška pri dohvaćanju mojih knjiga.'
      loading.value = false
    })
  } else {
    loading.value = false
  }

  // 2) Tuđe dostupne (status == available), lokalno isključi moje
  const qOthers = query(
    collection(db, 'books'),
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc')
  )
  unsubOthers = onSnapshot(qOthers, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    otherBooks.value = all.filter(b => b.userId !== u?.uid)
  }, (err) => {
    console.error(err)
    error.value = 'Greška pri dohvaćanju knjiga.'
  })
}, { immediate: true })

onBeforeUnmount(() => {
  if (unsubMine) unsubMine()
  if (unsubOthers) unsubOthers()
})

const deleteBook = async (id, ownerId) => {
  if (ownerId !== user.value?.uid) return // dodatna zaštita na klijentu
  if (!confirm('Sigurno obrisati knjigu?')) return
  try {
    await deleteDoc(doc(db, 'books', id))
  } catch (e) {
    console.error(e)
    error.value = 'Greška pri brisanju.'
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 space-y-8">
    <div v-if="loading" class="text-gray-500">Učitavam…</div>
    <div v-if="error" class="text-red-600">{{ error }}</div>

    <!-- Moje knjige -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xl font-bold">📚 Moje knjige</h3>
        <router-link to="/dodaj_knjigu" class="text-sm underline">+ Dodaj novu</router-link>
      </div>

      <div v-if="myBooks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="book in myBooks" :key="book.id" class="relative">
          <!-- kartica -->
          <BookCard :book="book" />
          <!-- gumbi iznad kartice (samo vlasnik vidi brisanje) -->
          <div class="mt-2 flex gap-2">
            <FavoritiButton :bookId="book.id" />
            <button
              v-if="book.userId === user?.uid"
              @click="deleteBook(book.id, book.userId)"
              class="text-sm px-3 py-1 rounded border hover:bg-red-50"
            >
              Obriši
            </button>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500">Niste još dodali nijednu knjigu.</p>
    </section>

    <!-- Tuđe knjige -->
    <section>
      <h3 class="text-xl font-bold mb-3">🔍 Dostupne knjige drugih korisnika</h3>

      <div v-if="otherBooks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="book in otherBooks" :key="book.id" class="relative">
          <BookCard :book="book" />
          <div class="mt-2">
            <FavoritiButton :bookId="book.id" />
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500">Trenutno nema drugih knjiga.</p>
    </section>
  </div>
</template>
