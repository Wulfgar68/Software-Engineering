<template>
  <div class="border rounded-lg p-4 flex flex-col justify-between bg-white">
    <!-- Header -->
    <div>
      <h3 class="text-lg font-semibold leading-tight truncate" :title="book.title">
        {{ book.title }}
      </h3>
      <p class="text-sm text-gray-600 truncate">Autor: {{ book.author }}</p>

      <span :class="['mt-2 inline-block text-xs px-2 py-1 rounded', badgeClass(book.status)]">
        {{ statusLabel(book.status) }}
      </span>
    </div>

    <!-- Meta chipovi -->
    <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
      <span v-if="book.price != null" class="px-2 py-0.5 rounded bg-gray-100">€{{ book.price }}</span>
      <span v-if="book.city" class="px-2 py-0.5 rounded bg-gray-100">{{ book.city }}</span>
      <span v-if="book.faculty" class="px-2 py-0.5 rounded bg-gray-100">{{ book.faculty }}</span>
      <span v-if="book.course" class="px-2 py-0.5 rounded bg-gray-100">{{ book.course }}</span>
    </div>

    <!-- Akcije -->
    <div class="mt-4 flex gap-2 flex-wrap">
      <RouterLink
        :to="`/book/${book.id}`"
        class="px-3 py-2 rounded bg-black text-white text-sm"
      >
        Detalji
      </RouterLink>

      <FavoritiButton :key="favKey" :bookId="book.id" />

      <!-- Chat gumb (samo ako nisam vlasnik i prijavljen sam) -->
      <button
        v-if="me && book.userId && me !== book.userId"
        @click="startChat(book.userId)"
        class="px-3 py-2 rounded border text-sm hover:bg-gray-50"
        title="Pošalji poruku prodavatelju"
      >
        💬 Poruka
      </button>

      <!-- Ako nisam prijavljen, pokaži disabled gumb s hintom -->
      <button
        v-else-if="!me"
        disabled
        class="px-3 py-2 rounded border text-sm opacity-60 cursor-not-allowed"
        title="Prijavite se za slanje poruke"
      >
        💬 Poruka
      </button>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import FavoritiButton from '@/components/Knjige/FavoritiButton.vue'
import { useAuthStore } from '@/stores/auth.js'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { ensureChat } from '@/utils/chat.js'

const props = defineProps({
  book: { type: Object, required: true }
})

const { user } = storeToRefs(useAuthStore())
const me = computed(() => user.value?.uid)
const favKey = computed(() => `${me.value ?? 'anon'}_${props.book.id}`)
const router = useRouter()

const startChat = async (ownerUid) => {
  console.log('Ja sam: ', me.value, ' vlasnik je: ', ownerUid)
  if (!me.value) return
  if (!ownerUid || ownerUid === me.value) return // ne otvaraj chat sam sa sobom
  try {
    const chatId = await ensureChat(me.value, ownerUid) // ensureChat vraća string
    router.push(`/chat/${chatId}`)
  } catch (e) {
    console.error('Ne mogu otvoriti chat:', e)
  }
}

const badgeClass = (status) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-700'
    case 'reserved':  return 'bg-yellow-100 text-yellow-700'
    case 'sold':
    case 'lent':      return 'bg-gray-100 text-gray-700'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

const statusLabel = (code) => {
  switch (code) {
    case 'available': return 'Dostupna'
    case 'reserved':  return 'Rezervirana'
    case 'sold':      return 'Prodana'
    case 'lent':      return 'Posuđena'
    default:          return code
  }
}
</script>
