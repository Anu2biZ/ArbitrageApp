import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ],
  runtimeConfig: {
    public: {
      websocketUrl: 'ws://localhost:3001'
    }
  },
  nitro: {
    plugins: ['~/server/websocket/scanner.ts'],
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json'
        }
      },
      '/ws': {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    }
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
