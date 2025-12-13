<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- HERO -->
    <header class="border-b bg-white/70 backdrop-blur">
      <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Tržnica knjiga</h1>
          <p class="text-gray-600">Prodaj • razmijeni • posudi • pokloni — studentima, od studenata.</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- view toggle -->
          <div class="flex rounded-lg border overflow-hidden">
            <button
              class="px-3 py-2 text-sm"
              :class="viewMode==='grid' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'"
              @click="viewMode='grid'"
              aria-pressed="viewMode==='grid'"
              title="Mreža"
            >
              ▦ Mreža
            </button>
            <button
              class="px-3 py-2 text-sm border-l"
              :class="viewMode==='list' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'"
              @click="viewMode='list'"
              aria-pressed="viewMode==='list'"
              title="Lista"
            >
              ☰ Popis
            </button>
          </div>

          <router-link
            to="/dodaj_knjigu"
            class="rounded-xl px-4 py-2 bg-black text-white text-sm shadow hover:shadow-md transition"
          >
            + Dodaj knjigu
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 space-y-12">
      <!-- FILTERI / SEARCH -->
      <section class="bg-white border rounded-2xl p-4 shadow-sm">
        <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <!-- pretraga -->
          <div class="md:col-span-2 lg:col-span-3">
            <input
              v-model="searchInput"
              type="text"
              placeholder="Pretraži naslov ili autora…"
              class="w-full border rounded-lg px-3 py-2"
              @input="onSearchInput"
            />
          </div>

          <!-- faculty -->
          <div>
            <select v-model="faculty" class="w-full border rounded-lg px-3 py-2">
              <option value="">Fakultet (svi)</option>
              <option v-for="f in faculties" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>

          <!-- course -->
          <div>
            <select v-model="course" class="w-full border rounded-lg px-3 py-2">
              <option value="">Kolegij (svi)</option>
              <option v-for="c in courses" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <!-- city -->
          <div>
            <select v-model="city" class="w-full border rounded-lg px-3 py-2">
              <option value="">Grad (svi)</option>
              <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <!-- cijena -->
          <div class="md:col-span-3 lg:col-span-2 flex gap-2">
            <input v-model.number="minPrice" type="number" min="0" placeholder="Min €" class="w-full border rounded-lg px-3 py-2" />
            <input v-model.number="maxPrice" type="number" min="0" placeholder="Max €" class="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <!-- TAGOVI -->
        <div class="mt-4">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="text-sm text-gray-700">Tagovi</div>
            <input
              v-model="tagQuery"
              type="text"
              placeholder="Filtriraj tagove…"
              class="border rounded px-2 py-1 text-sm"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in filteredTagOptions"
              :key="t"
              type="button"
              class="px-2 py-1 rounded border text-sm"
              :class="selectedTagsSet.has(t) ? 'bg-black text-white border-black' : 'hover:bg-gray-50'"
              @click="toggleTag(t)"
              :title="t"
            >
              #{{ t }}
            </button>
          </div>

          <div v-if="selectedTags.length" class="mt-2 text-sm text-gray-600">
            Odabrano:
            <span class="inline-flex gap-2 flex-wrap">
              <span
                v-for="t in selectedTags"
                :key="t"
                class="px-2 py-0.5 rounded bg-gray-100"
              >
                #{{ t }}
              </span>
            </span>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-3">
          <button
            class="px-3 py-2 rounded border text-sm hover:bg-gray-50"
            @click="clearFilters"
          >
            Očisti filtre
          </button>
          <span class="text-sm text-gray-600">
            Pronađeno: {{ filteredOtherBooks.length }} tuđih · {{ filteredMyBooks.length }} mojih
          </span>
        </div>
      </section>

      <!-- STATUS / ERRORS -->
      <div v-if="loading" class="text-gray-500">Učitavam…</div>
      <div v-if="error" class="text-red-600">{{ error }}</div>

      <!-- MOJE KNJIGE -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">📚 Moje knjige</h2>
          <span class="text-sm text-gray-500" v-if="filteredMyBooks.length">{{ filteredMyBooks.length }} kom.</span>
        </div>

        <!-- GRID -->
        <div v-if="viewMode==='grid'">
          <div v-if="filteredMyBooks.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="book in filteredMyBooks" :key="book.id" class="group">
              <BookCard :book="book" />
              <div class="mt-2 flex items-center gap-2">
                <button
                  @click="deleteBook(book.id, book.userId)"
                  class="text-sm px-3 py-1 rounded border hover:bg-red-50 transition"
                  title="Obriši oglas"
                >
                  Obriši
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500">Nema rezultata za odabrane filtre.</p>
        </div>

        <!-- LIST -->
        <div v-else>
          <ul v-if="filteredMyBooks.length" class="divide-y bg-white rounded-lg border">
            <li v-for="book in filteredMyBooks" :key="book.id" class="flex items-center justify-between gap-3 p-3">
              <div class="min-w-0">
                <RouterLink :to="`/book/${book.id}`" class="font-medium hover:underline truncate block">
                  {{ book.title }}
                </RouterLink>
                <div class="text-sm text-gray-600 truncate">Autor: {{ book.author }}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs px-2 py-0.5 rounded bg-gray-100">{{ hrStatus(book.status) }}</span>
                <RouterLink :to="`/book/${book.id}`" class="text-sm px-3 py-1 rounded border hover:bg-gray-50">Detalji</RouterLink>
                <button
                  @click="deleteBook(book.id, book.userId)"
                  class="text-sm px-3 py-1 rounded border hover:bg-red-50"
                >Obriši</button>
              </div>
            </li>
          </ul>
          <p v-else class="text-gray-500">Nema rezultata za odabrane filtre.</p>
        </div>
      </section>

      <!-- TUĐE DOSTUPNE -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">🔍 Dostupne knjige drugih korisnika</h2>
          <span class="text-sm text-gray-500" v-if="filteredOtherBooks.length">{{ filteredOtherBooks.length }} kom.</span>
        </div>

        <!-- GRID -->
        <div v-if="viewMode==='grid'">
          <div v-if="filteredOtherBooks.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="book in filteredOtherBooks" :key="book.id" class="group">
              <BookCard :book="book" />
            </div>
          </div>
          <p v-else class="text-gray-500">Nema rezultata za odabrane filtre.</p>
        </div>

        <!-- LIST -->
        <div v-else>
          <ul v-if="filteredOtherBooks.length" class="divide-y bg-white rounded-lg border">
            <li v-for="book in filteredOtherBooks" :key="book.id" class="flex items-center justify-between gap-3 p-3">
              <div class="min-w-0">
                <RouterLink :to="`/book/${book.id}`" class="font-medium hover:underline truncate block">
                  {{ book.title }}
                </RouterLink>
                <div class="text-sm text-gray-600 truncate">Autor: {{ book.author }}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs px-2 py-0.5 rounded bg-gray-100">{{ hrStatus(book.status) }}</span>
                <FavoritiButton :bookId="book.id" />
                <RouterLink :to="`/book/${book.id}`" class="text-sm px-3 py-1 rounded border hover:bg-gray-50">Detalji</RouterLink>
              </div>
            </li>
          </ul>
          <p v-else class="text-gray-500">Nema rezultata za odabrane filtre.</p>
        </div>
      </section>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase.js'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import { storeToRefs } from 'pinia'
import BookCard from '@/components/Knjige/BookCard.vue'
import FavoritiButton from '@/components/Knjige/FavoritiButton.vue'

const { user } = storeToRefs(useAuthStore())

const loading = ref(true)
const error = ref('')
const openChat = ref(false)
const viewMode = ref('grid') // 'grid' | 'list'

const availableBooks = ref([]) // sve 'available' (moje + tuđe)
const myBooks = ref([])

let unsubAvailable = null
let unsubMine = null

// --- SEARCH & FILTER STATE ---
const searchInput = ref('')   // raw input
const q = ref('')             // debounced query
const faculty = ref('')
const course = ref('')
const city = ref('')
const minPrice = ref()
const maxPrice = ref()

// TAG FILTER STATE
const selectedTags = ref([])         // ['skripta','obavezno']
const selectedTagsSet = computed(() => new Set(selectedTags.value))
const tagQuery = ref('')
const tagOptions = computed(() => {
  // izvuci sve tagove iz availableBooks (unique, sorted)
  const set = new Set()
  for (const b of availableBooks.value) {
    if (Array.isArray(b.tags)) b.tags.forEach(t => t && set.add(String(t)))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})
const filteredTagOptions = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  if (!q) return tagOptions.value
  return tagOptions.value.filter(t => t.toLowerCase().includes(q))
})
const toggleTag = (t) => {
  const i = selectedTags.value.findIndex(x => x.toLowerCase() === t.toLowerCase())
  if (i >= 0) selectedTags.value.splice(i, 1)
  else selectedTags.value.push(t)
}

// debounce: 250ms
let tmo = null
const onSearchInput = () => {
  if (tmo) clearTimeout(tmo)
  tmo = setTimeout(() => { q.value = searchInput.value.trim().toLowerCase() }, 250)
}

// helper
const norm = (v) => (v ?? '').toString().toLowerCase().trim()

// 1) Realtime: sve dostupne knjige
const qAvailable = query(
  collection(db, 'books'),
  where('status', '==', 'available'),
  orderBy('createdAt', 'desc')
)
unsubAvailable = onSnapshot(
  qAvailable,
  (snap) => {
    availableBooks.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  },
  (e) => { console.error(e); error.value = 'Greška pri dohvaćanju knjiga.'; loading.value = false }
)

// 2) Realtime: moje knjige
watch(user, (u) => {
  if (unsubMine) { unsubMine(); unsubMine = null }
  myBooks.value = []
  if (!u?.uid) return
  const qMine = query(
    collection(db, 'books'),
    where('userId', '==', u.uid),
    orderBy('createdAt', 'desc')
  )
  unsubMine = onSnapshot(
    qMine,
    (snap) => { myBooks.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    (e) => { console.error(e); error.value = 'Greška pri dohvaćanju mojih knjiga.' }
  )
}, { immediate: true })

// dinamički popisi za selecte (iz dostupnih oglasa)
const faculties = computed(() => {
  const set = new Set(availableBooks.value.map(b => b.faculty).filter(Boolean))
  return Array.from(set).sort()
})
const courses = computed(() => {
  const set = new Set(
    availableBooks.value
      .filter(b => !faculty.value || b.faculty === faculty.value)
      .map(b => b.course)
      .filter(Boolean)
  )
  return Array.from(set).sort()
})
const cities = computed(() => {
  const set = new Set(availableBooks.value.map(b => b.city).filter(Boolean))
  return Array.from(set).sort()
})

// zajednička funkcija za filtriranje
const passFilters = (b) => {
  // text search: title/author
  const hitsText = !q.value
    || norm(b.title).includes(q.value)
    || norm(b.author).includes(q.value)

  // select filteri (ako su zadani)
  const hitsFaculty = !faculty.value || b.faculty === faculty.value
  const hitsCourse  = !course.value  || b.course === course.value
  const hitsCity    = !city.value    || b.city === city.value

  // cijena
  const price = typeof b.price === 'number' ? b.price : Number(b.price)
  const hasPrice = !Number.isNaN(price) 
  const hitsMin = minPrice.value == null || minPrice.value === '' || (hasPrice && price >= Number(minPrice.value))
  const hitsMax = maxPrice.value == null || maxPrice.value === '' || (hasPrice && price <= Number(maxPrice.value))

  // tagovi: knjiga mora imati SVE odabrane tagove
  const sel = selectedTags.value.map(t => t.toLowerCase())
  const bookTags = Array.isArray(b.tags) ? b.tags.map(t => String(t).toLowerCase()) : []
  const hitsTags = sel.length === 0 || sel.every(t => bookTags.includes(t))

  return hitsText && hitsFaculty && hitsCourse && hitsCity && hitsMin && hitsMax && hitsTags
}

// reaktivni prikazi
const otherBooks = computed(() =>
  availableBooks.value.filter(b => b.userId !== user.value?.uid)
)
const filteredOtherBooks = computed(() =>
  otherBooks.value.filter(passFilters)
)
const filteredMyBooks = computed(() =>
  myBooks.value.filter(passFilters)
)

onBeforeUnmount(() => {
  if (unsubAvailable) unsubAvailable()
  if (unsubMine) unsubMine()
})

const deleteBook = async (bookId, ownerId) => {
  if (ownerId !== user.value?.uid) return
  if (!confirm('Sigurno obrisati knjigu?')) return

  try {
    // 1) obriši sve favorite te knjige
    const favQ = query(collection(db, 'favorites'), where('bookId', '==', bookId))
    const snap = await getDocs(favQ)
    if (!snap.empty) {
      const batch = writeBatch(db)
      snap.forEach(d => batch.delete(d.ref))
      await batch.commit()
    }
    // 2) obriši knjigu
    await deleteDoc(doc(db, 'books', bookId))
  } catch (e) {
    console.error(e)
    error.value = 'Greška pri brisanju.'
  }
}

const hrStatus = (code) => {
  switch (code) {
    case 'available': return 'Dostupna'
    case 'reserved':  return 'Rezervirana'
    case 'sold':      return 'Prodana'
    case 'lent':      return 'Posuđena'
    default:          return code
  }
}

const clearFilters = () => {
  searchInput.value = ''
  q.value = ''
  faculty.value = ''
  course.value = ''
  city.value = ''
  minPrice.value = undefined
  maxPrice.value = undefined
  selectedTags.value = []
  tagQuery.value = ''
}
</script>
