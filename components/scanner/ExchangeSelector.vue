<template>
  <div class="grid grid-cols-4 gap-4">
    <div v-for="exchange in exchanges" :key="exchange.id"
         class="flex items-center space-x-2 bg-gray-700 p-3 rounded">
      <input type="checkbox"
             :value="exchange.id"
             v-model="selected"
             class="rounded border-gray-600">
      <span class="text-white text-sm">{{ exchange.name }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const exchanges = [
  { id: 'binance', name: 'Binance' },
  { id: 'bybit', name: 'ByBit' },
  { id: 'kucoin', name: 'KuCoin' },
  { id: 'bitget', name: 'BitGet' },
  // другие биржи...
]

const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
