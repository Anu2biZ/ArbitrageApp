<template>
  <div class="grid grid-cols-4 gap-4">
    <div
      v-for="currency in currencies"
      :key="currency"
      @click="toggleCurrency(currency)"
      class="cursor-pointer p-2 rounded text-center"
      :class="{
        'bg-blue-600 text-white': selectedCurrencies.includes(currency),
        'bg-gray-700 text-gray-300 hover:bg-gray-600': !selectedCurrencies.includes(currency)
      }"
    >
      {{ currency }}
    </div>
  </div>
</template>

<script setup>
/**
 * Компонент CurrencySelector
 * 
 * Предназначение:
 * - Отображает список доступных валют для торговли
 * - Позволяет выбирать базовые валюты для поиска арбитражных возможностей
 * 
 * Логика работы:
 * 1. Получает список валют из торговых пар (PAIRS)
 * 2. Отображает валюты в виде кликабельных блоков в сетке
 * 3. Поддерживает множественный выбор валют
 * 4. При клике на валюту:
 *    - Если валюта не выбрана - добавляет её в список выбранных
 *    - Если валюта уже выбрана - удаляет её из списка
 * 5. Использует двустороннее связывание через v-model
 * 6. Визуально выделяет выбранные валюты синим цветом
 */

import { ref, watch } from 'vue'
import { PAIRS } from '~/store/scanner'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Извлекаем уникальные базовые валюты из списка торговых пар
// Например, из пары 'BTC/USDT' берём только 'BTC'
const currencies = Object.keys(PAIRS).map(pair => pair.split('/')[0])

// Реактивный массив выбранных валют, инициализируется значением из props
const selectedCurrencies = ref(props.modelValue)

/**
 * Обработчик клика по валюте
 * Если валюта уже выбрана - удаляет её из списка
 * Если валюта не выбрана - добавляет её в список
 * @param {string} currency - Код валюты (например, 'BTC', 'ETH')
 */
const toggleCurrency = (currency) => {
  const index = selectedCurrencies.value.indexOf(currency)
  if (index === -1) {
    selectedCurrencies.value.push(currency)
  } else {
    selectedCurrencies.value.splice(index, 1)
  }
}

// Отслеживаем изменения в выбранных валютах
// При любом изменении отправляем новый массив родительскому компоненту
watch(selectedCurrencies, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Отслеживаем изменения значения v-model извне
// Обновляем локальное состояние при изменении props
watch(() => props.modelValue, (newValue) => {
  selectedCurrencies.value = newValue
}, { deep: true })
</script>
