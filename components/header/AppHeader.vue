<template>
  <header class="bg-gray-800">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Логотип -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center">
            <span class="text-blue-500 font-bold text-xl">AS</span>
            <span class="text-white text-sm ml-2">Arbitrage Services</span>
          </NuxtLink>
        </div>

        <!-- Навигация -->
        <nav class="flex items-center space-x-4">
          <NuxtLink
              v-for="item in navigation"
              :key="item.path"
              :to="item.path"
              class="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
          >
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- Правая часть -->
        <div class="flex items-center space-x-4">
          <button class="text-gray-300 hover:text-white">
            <BellIcon class="h-6 w-6" />
          </button>
          <button class="text-gray-300 hover:text-white">
            <UserCircleIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { BellIcon, UserCircleIcon } from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Виды арбитража', path: '/arbitrage' },
  { name: 'Видео', path: '/video' },
  { name: 'Сканер', path: '/scanner' },
  { name: 'Тарифы', path: '/tariffs' },
  { name: 'Партнеры', path: '/partners' }
]
</script>
