<template>
  <div class="relative">
    <label v-if="label" class="block text-sm text-gray-600 mb-1">{{ label }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="open = true"
      @blur="() => setTimeout(() => open = false, 120)"
      :placeholder="placeholder"
      class="w-full border rounded-lg px-3 py-2"
      type="text"
      autocomplete="off"
    />
    <div
      v-if="open && suggestions.length"
      class="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow"
    >
      <button
        v-for="opt in suggestions"
        :key="opt"
        type="button"
        class="block w-full text-left px-3 py-2 hover:bg-gray-50"
        @mousedown.prevent="select(opt)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // ['Pravo', 'FER', ...]
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  minChars: { type: Number, default: 1 }, // nakon koliko slova nuditi prijedloge
  startsWithOnly: { type: Boolean, default: true }, // ako želiš contains, stavi false
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const suggestions = computed(() => {
  const q = (props.modelValue || '').toLowerCase().trim()
  if (q.length < props.minChars) return []
  return props.options
    .filter(o => !!o)
    .map(o => String(o))
    .filter(o => {
      const v = o.toLowerCase()
      return props.startsWithOnly ? v.startsWith(q) : v.includes(q)
    })
    .filter(o => o.toLowerCase() !== q) // ne nudi identičnu
    .slice(0, 8)
})

const select = (val) => {
  emit('update:modelValue', val)
  open.value = false
}
</script>
