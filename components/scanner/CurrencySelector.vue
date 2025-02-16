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
 * - Отображает список доступных монет для торговли
 * - Позволяет выбирать монеты для поиска арбитражных возможностей
 * 
 * Логика работы:
 * 1. Получает список монет из COINS
 * 2. Отображает монеты в виде кликабельных блоков в сетке
 * 3. Поддерживает множественный выбор монет
 * 4. При клике на монету:
 *    - Если монета не выбрана - добавляет её в список выбранных
 *    - Если монета уже выбрана - удаляет её из списка
 * 5. Использует двустороннее связывание через v-model
 * 6. Визуально выделяет выбранные монеты синим цветом
 */

import { ref, watch } from 'vue'
import { COINS } from '~/store/scanner'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Получаем список монет из COINS, исключая USDT
const currencies = Object.keys(COINS).filter(coin => coin !== 'USDT')

// Реактивный массив выбранных монет, инициализируется значением из props
const selectedCurrencies = ref(props.modelValue)

/**
 * Обработчик клика по монете
 * Если монета уже выбрана - удаляет её из списка
 * Если монета не выбрана - добавляет её в список
 * @param {string} currency - Код монеты (например, 'BTC', 'ETH')
 */
const toggleCurrency = (currency) => {
  const index = selectedCurrencies.value.indexOf(currency)
  if (index === -1) {
    selectedCurrencies.value.push(currency)
  } else {
    selectedCurrencies.value.splice(index, 1)
  }
}

// Отслеживаем изменения в выбранных монетах
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
