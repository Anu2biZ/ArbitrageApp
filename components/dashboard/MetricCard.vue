<template>
  <div class="bg-gray-800 rounded-lg p-6">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-gray-400 text-sm">{{ title }}</h3>
      <component :is="icon" class="w-5 h-5" :class="color" />
    </div>
    <p class="text-2xl font-bold text-white">{{ value }}</p>
  </div>
</template>

<script setup>
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

defineProps({
  title: String,
  value: String,
  icon: String,
  color: String
})
</script>
