<template>
  <div class="bg-gray-800 rounded-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-white">Балансы бирж</h2>
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-400">
          Сессия началась: {{ formatTime(sessionStartTime) }}
        </div>
        <button @click="resetSession" 
                class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded">
          Сбросить сессию
        </button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div v-for="exchange in exchanges" :key="exchange.name" 
           class="bg-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-center mb-3">
          <span class="text-white font-medium">{{ exchange.name }}</span>
          <span class="text-sm text-gray-400">Обновлено: {{ formatTime(exchange.lastUpdate) }}</span>
        </div>
        <div class="space-y-2">
          <div v-for="balance in exchange.balances" :key="balance.currency"
               class="flex justify-between items-center">
            <span class="text-gray-300">{{ balance.currency }}</span>
            <div class="text-right">
              <div class="text-white">
                {{ formatCrypto(balance.amount, balance.currency) }} {{ balance.currency }}
                ({{ formatUSD(balance.amount) }})
              </div>
              <div :class="getChangeClass(calculateBalanceChange(exchange.name, balance.currency, balance.amount))">
                {{ formatBalanceChange(
                  calculateBalanceChange(exchange.name, balance.currency, balance.amount),
                  balance.currency,
                  balance.amount
                ) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useScannerStore, COINS } from '~/store/scanner'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useDashboard } from '~/composables/useDashboard'

const store = useScannerStore()
const { sessionStartTime } = storeToRefs(store)

const props = defineProps({
  exchanges: {
    type: Array,
    required: true
  }
})

// Инициализируем сессию только при первом монтировании
onMounted(() => {
  if (props.exchanges) {
    store.initializeSession(props.exchanges)
  }
})

const resetSession = async () => {
  try {
    // Очищаем локальное состояние
    localStorage.clear()
    
    // Сбрасываем состояние на сервере
    const resetData = await $fetch('/api/dashboard/reset', {
      method: 'POST'
    })
    if (!resetData.success) {
      throw new Error('Server reset failed')
    }

    // Очищаем состояние в store
    store.$reset()
    
    // Инициализируем новую сессию с данными после сброса
    store.initializeSession(resetData.state.exchanges)
    
    // Принудительно обновляем страницу
    window.location.reload()
  } catch (error) {
    console.error('Error resetting session:', error)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

// Форматирование криптовалюты с 8 знаками после запятой для BTC и 4 для остальных
const formatCrypto = (value, currency) => {
  const decimals = currency === 'BTC' ? 8 : 4
  return value.toFixed(decimals)
}

const formatUSD = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

const calculateBalanceChange = (exchange, currency, currentAmount) => {
  return store.calculateBalanceChange(exchange, currency, currentAmount)
}

const formatBalanceChange = (change, currency, currentAmount) => {
  if (Math.abs(change) < 0.00001) {
    return `+0.0000 ${currency} (+$0.00)`
  }

  // Для USDT показываем изменение как есть
  if (currency === 'USDT') {
    const prefix = change >= 0 ? '+' : ''
    return `${prefix}${formatCrypto(change, currency)} ${currency} (${prefix}${formatUSD(change)})`
  }

  // Для других монет конвертируем USD изменение обратно в количество монет
  if (!(currency in COINS)) {
    return `+0.0000 ${currency} (+$0.00)`
  }

  const cryptoChange = change / COINS[currency].base
  const prefix = cryptoChange >= 0 ? '+' : ''
  return `${prefix}${formatCrypto(cryptoChange, currency)} ${currency} (${prefix}${formatUSD(change)})`
}

const getChangeClass = (change) => {
  if (Math.abs(change) < 0.00001) return { 'text-gray-400': true }
  return {
    'text-green-500': change > 0.00001,
    'text-red-500': change < -0.00001,
    'text-gray-400': Math.abs(change) <= 0.00001
  }
}
</script>
