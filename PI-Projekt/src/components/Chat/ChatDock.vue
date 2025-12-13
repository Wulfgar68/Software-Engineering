<template>
  <div class="fixed bottom-20 right-6 w-80 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
      <h3 class="font-semibold text-sm">Poruke</h3>
      <button @click="$emit('close')" class="text-gray-500 hover:text-black">✕</button>
    </div>

    <!-- Lista chatova -->
    <div class="max-h-64 overflow-y-auto">
      <!-- Prvi item = Chatbot -->
      <div
        class="px-3 py-2 border-b cursor-pointer hover:bg-gray-50 text-sm"
        @click="openChatbot"
      >
        🤖 EduLib Chatbot
      </div>

      <!-- Ostali chatovi -->
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="px-3 py-2 border-b cursor-pointer hover:bg-gray-50 text-sm"
        @click="$emit('open-chat', chat.id)"
      >
        {{ chat.otherUserName || 'Nepoznat korisnik' }}
      </div>

      <p v-if="!chats.length" class="p-3 text-gray-500 text-sm">Nema razgovora</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  chats: { type: Array, default: () => [] }
})

const emit = defineEmits(['open-chat', 'open-chatbot', 'close'])

const openChatbot = () => {
  emit('open-chatbot')
}
</script>
