import { defineStore } from 'pinia'

interface AuthState {
    token: string | null
    user: any | null
    isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: null,
        user: null,
        isAuthenticated: false
    }),
    actions: {
        async login(credentials: { email: string; password: string }) {
            // Имитация API запроса
            if (credentials.email === 'test@test.com' && credentials.password === 'password') {
                this.token = 'fake_token'
                this.isAuthenticated = true
                this.user = { id: 1, email: credentials.email }
                return true
            }
            throw new Error('Invalid credentials')
        },
        logout() {
            this.token = null
            this.user = null
            this.isAuthenticated = false
        }
    }
})
