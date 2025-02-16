<script setup>
/**
 * Страница межбиржевого сканера
 * 
 * Предназначение:
 * - Отображает интерфейс для поиска арбитражных возможностей между биржами
 * - Позволяет настраивать параметры сканирования и фильтрации результатов
 * - Отображает найденные возможности в виде таблицы с сортировкой
 * 
 * Основные компоненты:
 * 1. Селекторы бирж для покупки и продажи
 * 2. Селектор валютных пар
 * 3. Настройки фильтрации (объемы, прибыль, спред, комиссии)
 * 4. Таблица результатов с пагинацией
 * 
 * Логика работы:
 * 1. При монтировании компонента:
 *    - Загружаются начальные данные
 *    - Устанавливается WebSocket соединение для real-time обновлений
 * 2. При изменении фильтров:
 *    - Сбрасывается пагинация на первую страницу
 *    - Запрашиваются новые данные
 * 3. WebSocket обновления:
 *    - Получение актуальных цен в реальном времени
 *    - Обновление периода получения данных
 * 4. Сортировка и пагинация:
 *    - Возможность сортировки по любому столбцу
 *    - Пагинация результатов для оптимизации отображения
 */
import { storeToRefs } from 'pinia'
import { useScannerStore, PAIRS } from '~/store/scanner'
import { useFormatting } from '~/composables/useFormatting'
import ExchangeSelector from "~/components/scanner/ExchangeSelector.vue"
import CurrencySelector from "~/components/scanner/CurrencySelector.vue"
import Pagination from "~/components/ui/Pagination.vue"

const store = useScannerStore()
const { formatUSD } = useFormatting()
const { opportunities, summary, total } = storeToRefs(store)
const selectedBuyExchanges = ref([])
const selectedSellExchanges = ref([])
const selectedCurrencies = ref([])

// Отслеживание изменений фильтров
watch(() => store.filters, () => {
  store.page = 1 // Сбрасываем на первую страницу при изменении фильтров
  store.fetchOpportunities()
}, { deep: true })

// Отслеживание изменений страницы пагинации
watch(() => store.page, () => {
  store.fetchOpportunities()
})

// Отслеживание изменений в выбранных биржах и валютах
watch([selectedBuyExchanges, selectedSellExchanges, selectedCurrencies], ([buy, sell, currencies]) => {
  store.filters.buyExchanges = buy
  store.filters.sellExchanges = sell
  store.filters.currencies = currencies
  store.page = 1 // Сбрасываем на первую страницу при изменении выбранных бирж или валют
  store.fetchOpportunities()
}, { deep: true })

/**
 * Инициализация компонента при монтировании
 * 1. Загрузка начальных данных
 * 2. Установка WebSocket соединения
 * 3. Настройка обработчиков WebSocket событий
 * 4. Отслеживание изменений периода обновления
 */
onMounted(async () => {
  // Загрузка начальных данных с сервера
  await store.fetchOpportunities()

  const ws = new WebSocket('ws://localhost:3001')
  const wsRef = ref(null)

  ws.onopen = () => {
    console.log('Connected to WebSocket')
    wsRef.value = ws
    // Отправляем начальный период обновления
    ws.send(JSON.stringify({
      type: 'set_update_period',
      period: store.filters.updatePeriod
    }))
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    // При ошибке WebSocket пробуем перезагрузить данные
    store.fetchOpportunities()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'price_updates') {
        store.updatePrices(data.data)
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  }

  // Следим за изменением периода обновления
  watch(() => store.filters.updatePeriod, (newPeriod) => {
    if (wsRef.value && wsRef.value.readyState === WebSocket.OPEN) {
      wsRef.value.send(JSON.stringify({
        type: 'set_update_period',
        period: newPeriod
      }))
    }
  })

  // Очистка при размонтировании компонента
  onUnmounted(() => {
    if (wsRef.value) {
      wsRef.value.close()
    }
  })
})

// Конфигурация столбцов таблицы результатов
const columns = [
  { field: 'coin', label: 'Монета' },
  { field: 'buyPrice', label: 'Цена покупки' },
  { field: 'buyExchange', label: 'Биржа покупки' },
  { field: 'sellPrice', label: 'Цена продажи' },
  { field: 'sellExchange', label: 'Биржа продажи' },
  { field: 'spread', label: 'Спред, %' },
  { field: 'volume', label: 'Объём' },
  { field: 'commission', label: 'Комиссия' },
  { field: 'profit', label: 'Профит' }
]

/**
 * Обработчик сортировки таблицы
 * При клике на заголовок столбца:
 * - Если это текущее поле сортировки - меняет направление (asc/desc)
 * - Если это новое поле - устанавливает desc направление
 * @param {string} field - Поле для сортировки
 */
const handleSort = (field) => {
  store.sort.direction = store.sort.field === field
      ? store.sort.direction === 'asc' ? 'desc' : 'asc'
      : 'desc'
  store.sort.field = field
  store.fetchOpportunities()
}
</script>

<template>
  <div class="py-6">
    <h1 class="text-2xl font-bold text-white mb-6">Межбиржевой сканер</h1>

    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-white mb-4">Покупка</h3>
        <ExchangeSelector v-model="selectedBuyExchanges" />
      </div>
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-white mb-4">Продажа</h3>
        <ExchangeSelector v-model="selectedSellExchanges" />
      </div>
    </div>

    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 class="text-white mb-4">Настройте параметры</h3>
      <div class="mb-6">
        <h4 class="text-white mb-2">Валюты</h4>
        <CurrencySelector v-model="selectedCurrencies" />
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Минимальный объём, $</label>
          <input v-model="store.filters.minVolume" type="number" class="w-full bg-gray-700 text-white rounded px-4 py-2">
        </div>
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Максимальный объём, $</label>
          <input v-model="store.filters.maxVolume" type="number" class="w-full bg-gray-700 text-white rounded px-4 py-2">
        </div>
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Минимальная прибыль, %</label>
          <input v-model="store.filters.minProfit" type="number" class="w-full bg-gray-700 text-white rounded px-4 py-2">
        </div>
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Спред, %</label>
          <input v-model="store.filters.spread" type="number" class="w-full bg-gray-700 text-white rounded px-4 py-2">
        </div>
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Макс. комиссия, $</label>
          <input v-model="store.filters.maxCommission" type="number" class="w-full bg-gray-700 text-white rounded px-4 py-2">
        </div>
        <div>
          <label class="text-gray-400 text-sm mb-2 block">Период обновления, сек</label>
          <select v-model="store.filters.updatePeriod" class="w-full bg-gray-700 text-white rounded px-4 py-2">
            <option value="5">5 секунд</option>
            <option value="10">10 секунд</option>
            <option value="30">30 секунд</option>
          </select>
        </div>
      </div>
    </div>

    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-white mb-1">Результаты</h3>
          <div class="text-sm text-gray-400">
            Найдено возможностей: {{ summary.totalOpportunities }} |
            Средний спред: {{ summary.avgSpread }}% |
            Общий объем: {{ formatUSD(summary.totalVolume) }}
          </div>
        </div>
        <span class="text-gray-400 text-sm">
          Обновлено: {{ new Date(summary.lastUpdateTime).toLocaleTimeString() }}
        </span>
      </div>

      <div class="mb-4">
        <Pagination
            :total="total"
            :current-page="store.page"
            :per-page="store.limit"
            @change="page => store.page = page"
        />
      </div>

      <table class="w-full">
        <thead>
        <tr class="text-gray-400 border-b border-gray-700">
          <th
              v-for="column in columns"
              :key="column.field"
              @click="handleSort(column.field)"
              class="cursor-pointer hover:text-white"
          >
            {{ column.label }}
            <span v-if="store.sort.field === column.field">
                {{ store.sort.direction === 'asc' ? '↑' : '↓' }}
              </span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in opportunities"
            :key="item.id"
            class="text-white border-b border-gray-700 hover:bg-gray-700/50">
          <td class="py-4 text-center">{{ item.coin }}</td>
          <td class="text-center">{{ formatUSD(item.buyPrice) }}</td>
          <td class="text-center">{{ item.buyExchange }}</td>
          <td class="text-center">{{ formatUSD(item.sellPrice) }}</td>
          <td class="text-center">{{ item.sellExchange }}</td>
          <td class="text-center">
            <div class="text-gray-400 text-sm">{{ formatUSD((item.sellPrice - item.buyPrice) * item.volume / PAIRS[item.coin].base) }}</div>
            <div class="text-green-500">{{ item.spread }}%</div>
          </td>
          <td class="text-center">{{ formatUSD(item.volume) }}</td>
          <td class="text-center text-gray-400">{{ formatUSD(item.volume * 0.002) }}</td>
          <td class="text-center text-green-500">{{ formatUSD(item.profit) }}</td>
          <td class="text-center">
            <button class="bg-blue-600 px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Старт
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="mt-4">
        <Pagination
            :total="total"
            :current-page="store.page"
            :per-page="store.limit"
            @change="page => store.page = page"
        />
      </div>
    </div>
  </div>
</template>
