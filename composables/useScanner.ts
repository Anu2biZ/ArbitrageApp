export const useScanner = () => {
    const params = reactive({
        minVolume: 30,
        maxVolume: 2000,
        minProfit: 0.5,
        spread: 0.0,
        maxCommission: 1000,
        updatePeriod: 5
    })

    const selectedBuyExchanges = ref([])
    const selectedSellExchanges = ref([])

    const { data: results } = useFetch('/api/scanner', {
        watch: [params, selectedBuyExchanges, selectedSellExchanges]
    })

    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value)
    }

    return {
        params,
        selectedBuyExchanges,
        selectedSellExchanges,
        results,
        formatUSD
    }
}
