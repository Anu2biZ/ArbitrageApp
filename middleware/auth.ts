import { useAuthStore } from "~/store/auth"
import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import type { RouteLocationNormalized } from '#vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
    // Skip auth check for API routes
    if (to.path.startsWith('/api/')) {
        return
    }

    if (process.client) {
        const authStore = useAuthStore()
        const publicPages = ['/auth/login']

        if (!authStore.isAuthenticated && !publicPages.includes(to.path)) {
            return navigateTo('/auth/login')
        }
    }
})
