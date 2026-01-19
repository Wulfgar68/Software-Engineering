<template>
  <div class="max-w-2xl mx-auto p-4 space-y-4">
    <div class="flex items-center justify-between gap-2">
      <RouterLink to="/marketplace" class="text-sm underline">← natrag</RouterLink>
      <h1 class="text-2xl font-semibold truncate">Detalji knjige</h1>
      <div></div>
    </div>

    <div v-if="loading" class="text-gray-500">Učitavam…</div>
    <div v-else-if="!book" class="text-gray-500">Knjiga nije pronađena.</div>

    <div v-else class="border rounded p-4 space-y-3 bg-white">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-xl font-semibold truncate">{{ book.title }}</h2>
        <FavoritiButton v-if="book?.id" :bookId="book.id" />
      </div>

      <p class="text-gray-700">Autor: <b>{{ book.author }}</b></p>

      <div class="text-sm text-gray-600 space-y-1">
        <div>
          Status:
          <b>
            <span :class="['px-2 py-0.5 rounded text-xs', badgeClass(book.status)]">
              {{ statusLabel(book.status) }}
            </span>
          </b>
        </div>
        <div>
          Vlasnik:
          <RouterLink v-if="book?.userId" :to="`/users/${book.userId}`" class="font-semibold underline">
            {{ ownerName }}
          </RouterLink>
          <b v-else>{{ ownerName }}</b>
        </div>
        <div v-if="book.createdAt">Dodano: {{ humanDate(book.createdAt) }}</div>
      </div>

      <div v-if="book.description" class="pt-2">
        <h3 class="font-medium">Opis</h3>
        <p class="whitespace-pre-line">{{ book.description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
        <div v-if="book.faculty"><span class="text-gray-500">Fakultet:</span> {{ book.faculty }}</div>
        <div v-if="book.course"><span class="text-gray-500">Kolegij:</span> {{ book.course }}</div>
        <div v-if="book.city"><span class="text-gray-500">Grad:</span> {{ book.city }}</div>
        <div v-if="book.price != null"><span class="text-gray-500">Cijena:</span> €{{ book.price }}</div>
        <div v-if="Array.isArray(book.tags) && book.tags.length">
          <span class="text-gray-500">Tagovi:</span>
          <span class="inline-flex flex-wrap gap-2">
            <span v-for="t in book.tags" :key="t" class="px-2 py-0.5 rounded bg-gray-100">{{ t }}</span>
          </span>
        </div>
      </div>

      <div v-if="!isOwner" class="pt-4">
        <div class="border rounded-xl p-4 bg-gray-50">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium">Kupnja</div>
            <div v-if="book.price != null" class="text-sm text-gray-700">€{{ book.price }}</div>
          </div>

          <p v-if="!auth.user?.uid" class="text-sm text-gray-600 mt-2">
            Za kupnju moraš biti prijavljen.
          </p>

          <p v-else-if="book.status && book.status !== 'available'" class="text-sm text-gray-600 mt-2">
            Ova knjiga trenutno nije dostupna za kupnju. ({{ statusLabel(book.status) }})
          </p>

          <p v-else-if="!canPickup && !canOnline" class="text-sm text-red-600 mt-2">
            Za ovu knjigu nije postavljen način kupnje.
          </p>

          <div v-else class="mt-3 flex flex-wrap gap-2">
            <button
              v-if="canOnline"
              :disabled="buying || !canAct"
              @click="buyOnline"
              class="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
            >
              {{ buying ? 'Preusmjeravam…' : 'Kupi online' }}
            </button>

            <button
              v-if="canPickup"
              :disabled="reserving || !canAct"
              @click="reservePickup"
              class="px-3 py-2 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {{ reserving ? 'Rezerviram…' : 'Rezerviraj za uživo' }}
            </button>
          </div>

          <p v-if="actionError" class="text-red-600 text-sm mt-2">{{ actionError }}</p>
          <p v-if="actionOk" class="text-green-600 text-sm mt-2">{{ actionOk }}</p>
        </div>
      </div>

      <div v-if="isOwner" class="pt-4 flex flex-wrap gap-2">
        <select v-model="nextStatus" class="border rounded px-2 py-1">
          <option v-for="opt in statusOptions" :key="opt.code" :value="opt.code">
            {{ opt.label }}
          </option>
        </select>

        <button @click="changeStatus" class="px-3 py-2 rounded bg-black text-white text-sm">
          Spremi status
        </button>

        <button @click="removeBook" class="px-3 py-2 rounded border text-sm">
          Obriši
        </button>
      </div>

      <p v-if="errorMsg" class="text-red-600 text-sm">{{ errorMsg }}</p>
      <p v-if="okMsg" class="text-green-600 text-sm">{{ okMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import FavoritiButton from '@/components/Knjige/FavoritiButton.vue'
import { db } from '@/firebase.js'
import {
  doc, onSnapshot, updateDoc, deleteDoc, getDoc,
  query, where, getDocs, writeBatch, serverTimestamp, collection
} from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const book = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const okMsg = ref('')
const nextStatus = ref('available')
let unsub = null

const actionError = ref('')
const actionOk = ref('')
const buying = ref(false)
const reserving = ref(false)

const statusOptions = [
  { code: 'available', label: 'Dostupna' },
  { code: 'reserved',  label: 'Rezervirana' },
  { code: 'sold',      label: 'Prodana' },
  { code: 'lent',      label: 'Posuđena' },
]
const statusLabel = (code) => statusOptions.find(s => s.code === code)?.label ?? code
const badgeClass = (status) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-700'
    case 'reserved':  return 'bg-yellow-100 text-yellow-700'
    case 'sold':
    case 'lent':      return 'bg-gray-100 text-gray-700'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

const isOwner = computed(() => !!auth.user?.uid && auth.user.uid === book.value?.userId)

const methods = computed(() => book.value?.purchaseMethods || { pickup: true, online: false })
const canPickup = computed(() => !!methods.value.pickup)
const canOnline = computed(() => !!methods.value.online)

const canAct = computed(() => {
  return !!auth.user?.uid && (book.value?.status === 'available' || !book.value?.status)
})

const ownerName = ref('Učitavam…')
const loadOwnerName = async (uid, fallbackEmail) => {
  try {
    const uref = doc(db, 'users', uid)
    const snap = await getDoc(uref)
    if (snap.exists()) {
      const data = snap.data()
      ownerName.value =
        data.fullName || data.username || data.firstName ||
        data.email?.split('@')[0] || 'Nepoznat korisnik'
    } else {
      ownerName.value = fallbackEmail?.split('@')[0] || 'Nepoznat korisnik'
    }
  } catch {
    ownerName.value = 'Nepoznat korisnik'
  }
}

onMounted(() => {
  const refDoc = doc(db, 'books', String(route.params.id))
  unsub = onSnapshot(refDoc, async (snap) => {
    loading.value = false
    if (!snap.exists()) { book.value = null; return }
    book.value = { id: snap.id, ...snap.data() }
    if (book.value.status) nextStatus.value = book.value.status
    if (book.value.userId) await loadOwnerName(book.value.userId, book.value.ownerEmail)
  }, (e) => {
    loading.value = false
    errorMsg.value = e?.message || 'Greška pri dohvaćanju.'
  })
})
onBeforeUnmount(() => { unsub && unsub() })

const reservePickup = async () => {
  actionError.value = ''
  actionOk.value = ''

  if (!auth.user?.uid) { actionError.value = 'Moraš biti prijavljen.'; return }
  if (!book.value?.id) { actionError.value = 'Nedostaje ID knjige.'; return }
  if (isOwner.value) { actionError.value = 'Ne možeš rezervirati vlastitu knjigu.'; return }
  if (book.value.status && book.value.status !== 'available') { actionError.value = 'Knjiga nije dostupna.'; return }
  if (!canPickup.value) { actionError.value = 'Uživo kupnja nije omogućena.'; return }

  reserving.value = true
  try {
    await updateDoc(doc(db, 'books', book.value.id), {
      status: 'reserved',
      reservedBy: auth.user.uid,
      reservedAt: serverTimestamp(),
    })
    actionOk.value = 'Rezervirano. Kontaktiraj vlasnika u chatu za preuzimanje.'
  } catch (e) {
    console.error(e)
    actionError.value = e?.message || 'Greška pri rezervaciji.'
  } finally {
    reserving.value = false
  }
}

const buyOnline = async () => {
  actionError.value = ''
  actionOk.value = ''

  if (!auth.user?.uid) { actionError.value = 'Moraš biti prijavljen.'; return }
  if (!book.value?.id) { actionError.value = 'Nedostaje ID knjige.'; return }
  if (isOwner.value) { actionError.value = 'Ne možeš kupiti vlastitu knjigu.'; return }
  if (book.value.status && book.value.status !== 'available') { actionError.value = 'Knjiga nije dostupna.'; return }
  if (!canOnline.value) { actionError.value = 'Online plaćanje nije omogućeno.'; return }

  buying.value = true
  try {
    actionError.value = 'Online plaćanje još nije spojeno (Stripe dolazi uskoro).'
  } finally {
    buying.value = false
  }
}

const changeStatus = async () => {
  errorMsg.value = ''; okMsg.value = ''
  try {
    if (!isOwner.value) {
      errorMsg.value = 'Nisi vlasnik oglasa.'
      return
    }
    await updateDoc(doc(db, 'books', String(route.params.id)), { status: nextStatus.value })
    okMsg.value = 'Status spremljen.'
  } catch (e) {
    console.error('changeStatus error:', e)
    errorMsg.value = e?.message || 'Greška pri promjeni statusa.'
  }
}

const removeBook = async () => {
  errorMsg.value = ''; okMsg.value = ''
  try {
    if (!isOwner.value) {
      errorMsg.value = 'Nisi vlasnik oglasa.'
      return
    }
    if (!confirm('Sigurno obrisati knjigu?')) return

    const favQ = query(collection(db, 'favorites'), where('bookId', '==', String(route.params.id)))
    const snap = await getDocs(favQ)
    if (!snap.empty) {
      const batch = writeBatch(db)
      snap.forEach(d => batch.delete(d.ref))
      await batch.commit()
    }

    await deleteDoc(doc(db, 'books', String(route.params.id)))
    router.push('/marketplace')
  } catch (e) {
    console.error('removeBook error:', e)
    errorMsg.value = e?.message || 'Greška pri brisanju.'
  }
}

const humanDate = (ts) => {
  try {
    const d = ts?.toDate?.() ?? new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}
</script>
