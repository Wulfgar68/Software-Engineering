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

      <div v-else class="bg-white border rounded-2xl p-4 shadow-sm space-y-6">
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

        <!-- MOJ PROFIL: akcije -->
        <div v-if="MojProfil" class="border-t pt-4 space-y-6">
          <!-- USERNAME -->
          <div>
            <div class="text-sm font-medium text-gray-700 mb-2">Promijeni username</div>

            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div class="flex-1">
                <input
                  v-model.trim="newUsername"
                  type="text"
                  placeholder="npr. mateo-segon"
                  class="w-full border rounded-lg px-3 py-2"
                />
                <div class="text-xs text-gray-500 mt-1">
                  Dozvoljeno: slova i brojevi (razmaci se pretvore u “-”).
                </div>
              </div>

              <button
                @click="saveUsername"
                :disabled="savingUsername || !canSaveUsername"
                class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                {{ savingUsername ? 'Spremam…' : 'Spremi' }}
              </button>
            </div>

            <p v-if="usernameError" class="text-red-600 text-sm mt-2">{{ usernameError }}</p>
            <p v-if="usernameOk" class="text-green-600 text-sm mt-2">{{ usernameOk }}</p>
          </div>

          <!-- LOZINKA -->
          <div>
            <div class="text-sm font-medium text-gray-700 mb-2">Promijeni lozinku</div>

            <div class="grid gap-2 sm:grid-cols-3">
              <input
                v-model="currentPassword"
                type="password"
                placeholder="Trenutna"
                class="border rounded-lg px-3 py-2"
              />
              <input
                v-model="newPassword"
                type="password"
                placeholder="Nova"
                class="border rounded-lg px-3 py-2"
              />
              <input
                v-model="newPassword2"
                type="password"
                placeholder="Ponovi novu"
                class="border rounded-lg px-3 py-2"
              />
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <button
                @click="savePassword"
                :disabled="savingPassword || !canSavePassword"
                class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                {{ savingPassword ? 'Spremam…' : 'Spremi lozinku' }}
              </button>

              <button
                @click="resetPasswordForm"
                type="button"
                class="px-4 py-2 rounded border"
              >
                Očisti
              </button>
            </div>

            <p v-if="passwordError" class="text-red-600 text-sm mt-2">{{ passwordError }}</p>
            <p v-if="passwordOk" class="text-green-600 text-sm mt-2">{{ passwordOk }}</p>
          </div>

          <!-- DODAJ KNJIGU -->
          <div class="flex flex-wrap gap-2">
            <RouterLink
              to="/dodaj_knjigu"
              class="px-4 py-2 rounded bg-black text-white"
            >
              Dodaj knjigu
            </RouterLink>
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
  uid: { type: String, default: '' }
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

const newUsername = ref('')
const savingUsername = ref(false)
const usernameError = ref('')
const usernameOk = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const newPassword2 = ref('')
const savingPassword = ref(false)
const passwordError = ref('')
const passwordOk = ref('')

const canSaveUsername = computed(() => {
  const u = (newUsername.value || '').trim()
  if (!u) return false
  if (u.length < 3) return false
  if (u.length > 20) return false
  return true
})

const canSavePassword = computed(() => {
  if (!currentPassword.value || !newPassword.value || !newPassword2.value) return false
  if (newPassword.value.length < 6) return false
  if (newPassword.value !== newPassword2.value) return false
  return true
})

const loadProfile = async (uid) => {
  loadingProfile.value = true
  profileError.value = ''
  profile.value = null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      profile.value = snap.data()
      if (MojProfil.value) newUsername.value = profile.value?.username || ''
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

const saveUsername = async () => {
  usernameError.value = ''
  usernameOk.value = ''
  if (!MojProfil.value) return
  if (!auth.user?.uid) { usernameError.value = 'Moraš biti prijavljen.'; return }
  if (!canSaveUsername.value) { usernameError.value = 'Neispravan username.'; return }

  savingUsername.value = true
  try {
    const saved = await auth.claimUsername(auth.user.uid, newUsername.value)
    usernameOk.value = `Username spremljen: @${saved}`
    await loadProfile(props.uid)
  } catch (e) {
    usernameError.value = e?.message || 'Greška pri spremanju username-a.'
  } finally {
    savingUsername.value = false
  }
}

const resetPasswordForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  newPassword2.value = ''
}

const savePassword = async () => {
  passwordError.value = ''
  passwordOk.value = ''
  if (!MojProfil.value) return
  if (!auth.user?.uid) { passwordError.value = 'Moraš biti prijavljen.'; return }
  if (!canSavePassword.value) { passwordError.value = 'Provjeri polja (min 6 znakova, lozinke se moraju poklapati).'; return }

  savingPassword.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    passwordOk.value = 'Lozinka je promijenjena.'
    resetPasswordForm()
  } catch (e) {
    passwordError.value = e?.message || 'Greška pri promjeni lozinke.'
  } finally {
    savingPassword.value = false
  }
}

onMounted(async () => {
  if (!props.uid) { profileError.value = 'Niste prijavljeni.'; loadingProfile.value = false; return }
  await loadProfile(props.uid)
  subBooks(props.uid)
})

watch(() => props.uid, async (newUid) => {
  if (!newUid) return
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
