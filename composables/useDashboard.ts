import { useFetch } from 'nuxt/app'

export const useDashboard = () => {
    const { data: dashboardData, refresh } = useFetch('/api/dashboard', {
        key: 'dashboard',
        watch: false
    })

    const formatUSD = (value: number | undefined) => {
        if (!value) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value)
    }

    return {
        dashboardData,
        formatUSD,
        refresh
    }
}
