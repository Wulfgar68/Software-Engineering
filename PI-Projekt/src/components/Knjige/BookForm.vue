<template>
  <div class="max-w-xl mx-auto p-6 border rounded-2xl bg-white space-y-4">
    <h2 class="text-2xl font-semibold">Dodaj novu knjigu</h2>

    <form @submit.prevent="addBook" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Naslov *</label>
        <input v-model.trim="title" type="text" required class="w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Autor *</label>
        <input v-model.trim="author" type="text" required class="w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Opis</label>
        <textarea
          v-model.trim="description"
          rows="4"
          placeholder="Kratak opis, izdanje, stanje, bilješke…"
          class="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <Typeahead v-model="faculty" :options="faculties" label="Fakultet" placeholder="npr. Pravni" />
        <Typeahead v-model="course"  :options="coursesFilteredByFaculty" label="Kolegij" placeholder="npr. Kazneno pravo" />
        <Typeahead v-model="city"    :options="cities" label="Grad" placeholder="npr. Zagreb" />
        <div>
          <label class="block text-sm text-gray-600 mb-1">Cijena (€)</label>
          <input v-model.number="price" type="number" min="0" step="1" class="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Tagovi (zarezom odvojeni)</label>
        <input
          v-model="tagsInput"
          type="text"
          placeholder="npr. skripta, obavezna literatura"
          class="w-full border rounded-lg px-3 py-2"
        />
        <div v-if="tagSuggestions.length" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="t in tagSuggestions"
            :key="t"
            class="px-2 py-1 text-sm rounded border hover:bg-gray-50"
            type="button"
            @click="addTagSuggestion(t)"
          >
            + {{ t }}
          </button>
        </div>
      </div>

      <div class="border rounded-xl p-4 bg-gray-50">
        <div class="text-sm font-medium text-gray-700 mb-2">Način kupnje</div>

        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="methodPickup" class="accent-black" />
            Uživo (preuzimanje)
          </label>

          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="methodOnline" class="accent-black" />
            Online plaćanje
          </label>
        </div>

        <p v-if="methodError" class="text-sm text-red-600 mt-2">
          {{ methodError }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button :disabled="saving" type="submit" class="bg-black text-white px-4 py-2 rounded">
          {{ saving ? 'Spremam…' : 'Dodaj knjigu' }}
        </button>
        <span v-if="error" class="text-red-600">{{ error }}</span>
        <span v-if="success" class="text-green-600">{{ success }}</span>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase.js'
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.js'
import Typeahead from '@/components/Knjige/Typeahead.vue'

const auth = useAuthStore()

const title = ref('')
const author = ref('')
const description = ref('')
const faculty = ref('')
const course = ref('')
const city = ref('')
const price = ref()
const tagsInput = ref('')

const methodPickup = ref(true)
const methodOnline = ref(false)
const methodError = ref('')

const saving = ref(false)
const error = ref('')
const success = ref('')

const faculties = ref([])
const courses = ref([])
const cities = ref([])
const allTags = ref([])

const courseToFaculty = new Map()

const coursesFilteredByFaculty = computed(() => {
  if (!faculty.value) return courses.value
  return courses.value.filter(c => !!c && courseToFaculty.get(c) === faculty.value)
})

onMounted(async () => {
  try {
    const qAvail = query(
      collection(db, 'books'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(qAvail)
    const fset = new Set()
    const cset = new Set()
    const cityset = new Set()
    const tset = new Set()

    snap.forEach(d => {
      const b = d.data()
      if (b.faculty) fset.add(String(b.faculty))
      if (b.course)  { cset.add(String(b.course)); if (b.faculty) courseToFaculty.set(String(b.course), String(b.faculty)) }
      if (b.city)    cityset.add(String(b.city))
      if (Array.isArray(b.tags)) b.tags.forEach(t => t && tset.add(String(t)))
    })

    faculties.value = Array.from(fset).sort()
    courses.value   = Array.from(cset).sort()
    cities.value    = Array.from(cityset).sort()
    allTags.value   = Array.from(tset).sort()
  } catch (e) {
    console.error(e)
  }
})

const tagSuggestions = computed(() => {
  const parts = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean)
  const current = parts[parts.length - 1] || ''
  if (!current) return []
  const low = current.toLowerCase()
  return allTags.value
    .filter(t => t.toLowerCase().startsWith(low) && !parts.map(p => p.toLowerCase()).includes(t.toLowerCase()))
    .slice(0, 8)
})

const addTagSuggestion = (t) => {
  const parts = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean)
  const existsIdx = parts.findIndex(p => p.toLowerCase() === t.toLowerCase())
  if (existsIdx === -1) parts.push(t)
  tagsInput.value = parts.join(', ')
}

const parseTags = () => {
  const arr = tagsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.length > 40 ? s.slice(0, 40) : s)

  const seen = new Set()
  return arr.filter(t => {
    const k = t.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

const addBook = async () => {
  error.value = ''
  success.value = ''
  methodError.value = ''

  if (!methodPickup.value && !methodOnline.value) {
    methodError.value = 'Odaberi barem jedan način kupnje.'
    return
  }

  if (!title.value || !author.value) {
    error.value = 'Molimo ispunite naslov i autora.'
    return
  }
  if (!auth.user?.uid) {
    error.value = 'Moraš biti prijavljen.'
    return
  }

  saving.value = true
  try {
    const docData = {
      title: title.value.trim(),
      author: author.value.trim(),
      description: description.value.trim() || null,
      faculty: faculty.value.trim() || null,
      course: course.value.trim() || null,
      city: city.value.trim() || null,
      price: typeof price.value === 'number' && !Number.isNaN(price.value) ? price.value : null,
      tags: parseTags(),
      userId: auth.user.uid,
      status: 'available',
      purchaseMethods: { pickup: !!methodPickup.value, online: !!methodOnline.value },
      createdAt: serverTimestamp(),
    }

    Object.keys(docData).forEach(k => docData[k] === null && delete docData[k])

    await addDoc(collection(db, 'books'), docData)

    title.value = ''
    author.value = ''
    description.value = ''
    faculty.value = ''
    course.value = ''
    city.value = ''
    price.value = undefined
    tagsInput.value = ''
    methodPickup.value = true
    methodOnline.value = false
    methodError.value = ''
    success.value = 'Knjiga je dodana.'
  } catch (e) {
    console.error(e)
    error.value = e?.message || 'Greška prilikom dodavanja.'
  } finally {
    saving.value = false
  }
}
</script>
