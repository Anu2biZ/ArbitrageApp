export const useDashboard = () => {
    const { data: dashboardData } = useFetch('/api/dashboard')

    const formatUSD = (value) => {
        if (!value) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value)
    }

    return {
        dashboardData,
        formatUSD
    }
}
