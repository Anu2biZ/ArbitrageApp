<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="max-w-md w-full bg-gray-800 rounded-lg p-8">
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-white text-center">Arbitrage Services</h2>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="text-white block mb-2">Email</label>
          <input
              v-model="email"
              type="email"
              class="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
          />
        </div>

        <div>
          <label class="text-white block mb-2">Password</label>
          <input
              v-model="password"
              type="password"
              class="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
          />
        </div>

        <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
import { useAuthStore } from '~/store/auth'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await authStore.login({
      email: email.value,
      password: password.value
    })
    await router.push('/dashboard')
  } catch (error) {
    // Здесь будем добавлять уведомления об ошибке
    console.error(error)
  }
}
</script>
