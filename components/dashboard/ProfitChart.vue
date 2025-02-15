// components/dashboard/ProfitChart.vue
<template>
  <div class="h-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps({
  data: Array
})

const chartData = computed(() => ({
  labels: props.data?.map(d => d.date) || [],
  datasets: [{
    label: 'Прибыль',
    data: props.data?.map(d => d.value) || [],
    borderColor: '#3B82F6',
    tension: 0.1
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#9CA3AF'
      }
    },
    x: {
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#9CA3AF'
      }
    }
  }
}
</script>
