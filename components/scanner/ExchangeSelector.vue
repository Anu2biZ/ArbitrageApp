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
/**
 * Компонент ExchangeSelector
 * 
 * Предназначение:
 * - Отображает список бирж с возможностью множественного выбора
 * - Используется в сканере для выбора бирж, по которым будет производиться поиск арбитражных возможностей
 * 
 * Логика работы:
 * 1. Компонент принимает текущие выбранные биржи через v-model (props.modelValue)
 * 2. При изменении выбора эмитит событие update:modelValue с новым массивом выбранных бирж
 * 3. Использует двустороннее связывание данных через computed свойство selected
 * 4. Отображает биржи в виде сетки с чекбоксами, 4 элемента в строку
 */

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

// Массив доступных бирж для выбора
const exchanges = [
  { id: 'Binance', name: 'Binance' },
  { id: 'Bybit', name: 'Bybit' },
  { id: 'KuCoin', name: 'KuCoin' },
  { id: 'OKX', name: 'OKX' },
  { id: 'Bitget', name: 'Bitget' },
  { id: 'Huobi', name: 'Huobi' },
  { id: 'Gate.io', name: 'Gate.io' },
  { id: 'Kraken', name: 'Kraken' }
]

// Вычисляемое свойство для двустороннего связывания данных
// get - получает текущие выбранные биржи из props
// set - эмитит событие с обновленным списком выбранных бирж
const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
