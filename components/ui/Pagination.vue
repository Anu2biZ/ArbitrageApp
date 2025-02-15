// components/ui/Pagination.vue
<template>
  <div class="flex items-center justify-between px-4 py-3 bg-gray-800 rounded-lg">
    <div class="text-sm text-gray-400">
      Показано {{ from }}-{{ to }} из {{ total }}
    </div>
    <div class="flex space-x-2">
      <button
          @click="handlePageChange(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
      >
        Назад
      </button>

      <button
          v-for="page in pages"
          :key="page"
          @click="handlePageChange(page)"
          :class="[
         'px-3 py-1 rounded',
         currentPage === page ? 'bg-blue-600' : 'bg-gray-700'
       ]"
      >
        {{ page }}
      </button>

      <button
          @click="handlePageChange(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
      >
        Вперед
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  total: Number,
  currentPage: Number,
  perPage: Number
})

const emit = defineEmits(['change'])

const totalPages = computed(() => Math.ceil(props.total / props.perPage))
const from = computed(() => (props.currentPage - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.currentPage * props.perPage, props.total))

const pages = computed(() => {
  const range = []
  for (let i = 1; i <= totalPages.value; i++) {
    range.push(i)
  }
  return range
})

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('change', page)
  }
}
</script>
