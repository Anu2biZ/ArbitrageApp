<template>
  <div class="min-h-screen bg-gray-900">
    <AppHeader />
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>
    <Notification />
  </div>
</template>

<script setup>
import AppHeader from '~/components/header/AppHeader.vue'
import Notification from '~/components/ui/Notification.vue'
</script>
