<template>
  <div class="py-6">
    <!-- Метрики -->
    <div class="grid grid-cols-3 gap-6 mb-8">
      <MetricCard
          title="Общий профит"
          :value="formatUSD(dashboardData?.metrics.totalProfit)"
          icon="CurrencyDollar"
          color="text-green-500"
      />
      <MetricCard
          title="Прибыль за 24ч"
          :value="formatUSD(dashboardData?.metrics.dailyProfit)"
          icon="ArrowTrendingUp"
          color="text-blue-500"
      />
      <MetricCard
          title="Объем за 24ч"
          :value="formatUSD(dashboardData?.metrics.volume24h)"
          icon="ChartBar"
          color="text-purple-500"
      />
    </div>

    <!-- Балансы бирж -->
    <div class="mb-8">
      <ExchangeBalances :exchanges="dashboardData?.exchanges" />
    </div>

    <!-- График и активные сделки -->
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold text-white mb-4">Прибыль по дням</h2>
        <div class="h-64">
          <ProfitChart :data="dashboardData?.profitChart" />
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold text-white mb-4">Активные сделки</h2>
        <div class="space-y-4">
          <div v-for="deal in dashboardData?.activeDeals" :key="deal.id"
               class="p-4 bg-gray-700 rounded-lg">
            <div class="flex justify-between mb-2">
              <span class="text-white font-medium">{{ deal.pair }}</span>
              <span :class="deal.profit >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ formatUSD(deal.profit) }}
              </span>
            </div>
            <div class="text-sm text-gray-400">
              {{ deal.exchanges }}
            </div>
            <div class="flex justify-between mt-2 text-sm">
              <span class="text-gray-400">{{ formatUSD(deal.amount) }}</span>
              <span :class="getStatusColor(deal.status)">{{ deal.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- История арбитражных сделок -->
    <div class="mt-8 bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-bold text-white mb-4">История сделок</h2>
      <table class="w-full">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-2">Дата</th>
            <th>Пара</th>
            <th>Покупка</th>
            <th>Продажа</th>
            <th>Объём</th>
            <th>Спред</th>
            <th>Комиссия</th>
            <th>Чистый профит</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="deal in dashboardData?.history" :key="deal.id" 
              class="text-white border-b border-gray-700">
            <td class="py-4 text-center">{{ new Date(deal.date).toLocaleString() }}</td>
            <td class="text-center">{{ deal.pair }}</td>
            <td class="text-center">{{ deal.buyExchange }} ({{ formatUSD(deal.buyPrice) }})</td>
            <td class="text-center">{{ deal.sellExchange }} ({{ formatUSD(deal.sellPrice) }})</td>
            <td class="text-center">{{ formatUSD(deal.volume) }}</td>
            <td class="text-center">{{ deal.spread }}%</td>
            <td class="text-center text-red-500">-{{ formatUSD(deal.commission) }}</td>
            <td class="text-center" :class="deal.profit > deal.commission ? 'text-green-500' : 'text-red-500'">
              {{ formatUSD(deal.profit - deal.commission) }}
            </td>
            <td class="text-center">
              <span class="px-2 py-1 rounded text-sm" 
                    :class="deal.status === 'Завершено' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'">
                {{ deal.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
import { useDashboard } from '~/composables/useDashboard'
import MetricCard from "~/components/dashboard/MetricCard.vue"
import ProfitChart from "~/components/dashboard/ProfitChart.vue"
import ExchangeBalances from "~/components/dashboard/ExchangeBalances.vue"

const { dashboardData, formatUSD } = useDashboard()
definePageMeta({
  layout: 'default'
})

const getStatusColor = (status) => {
  return {
    'В процессе': 'text-blue-500',
    'Ожидание': 'text-yellow-500'
  }[status]
}
</script>
