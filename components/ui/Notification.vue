<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed top-4 right-4 z-50">
      <div :class="[
        'rounded-lg p-4 shadow-lg',
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      ]">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircleIcon v-if="type === 'success'" class="h-5 w-5 text-white" />
            <XCircleIcon v-else class="h-5 w-5 text-white" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-white">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="show = false"
              class="inline-flex text-white hover:text-gray-200 focus:outline-none"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const show = ref(false)
const message = ref('')
const type = ref('success')
let timeout = null

// Обработчик события уведомления
const handleNotification = (event) => {
  const { type: notificationType, message: notificationMessage } = event.detail
  
  // Очищаем предыдущий таймер если он есть
  if (timeout) {
    clearTimeout(timeout)
  }
  
  // Устанавливаем новые данные
  type.value = notificationType
  message.value = notificationMessage
  show.value = true
  
  // Автоматически скрываем через 5 секунд
  timeout = setTimeout(() => {
    show.value = false
  }, 5000)
}

onMounted(() => {
  window.addEventListener('arbitrage-notification', handleNotification)
})

onUnmounted(() => {
  window.removeEventListener('arbitrage-notification', handleNotification)
  if (timeout) {
    clearTimeout(timeout)
  }
})
</script>
