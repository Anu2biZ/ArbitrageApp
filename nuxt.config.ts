export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ],
  websocketsServer: {
    url: 'ws://localhost:3000'
  },
  router: {
    middleware: ['auth']
  },
  nitro: {
    websocket: true
  },

  css: ['~/assets/css/tailwind.css'],
  ssr: false,

  app: {
    head: {
      title: 'Arbitrage App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  vite: {
    resolve: {
      alias: {
        'lodash/get': 'lodash-es/get'
      }
    }
  },

  compatibilityDate: '2025-02-15'
})
