import {useAuthStore} from "~/store/auth";

export default defineNuxtRouteMiddleware((to) => {
    if (process.client) {
        const authStore = useAuthStore()
        const publicPages = ['/auth/login']

        if (!authStore.isAuthenticated && !publicPages.includes(to.path)) {
            return navigateTo('/auth/login')
        }
    }
})
