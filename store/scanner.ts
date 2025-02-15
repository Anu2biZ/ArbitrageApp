// store/scanner.ts
import { defineStore } from 'pinia'

export const useScannerStore = defineStore('scanner', {
    state: () => ({
        opportunities: [],
        page: 1,
        limit: 50,
        filters: {
            minVolume: 30,
            maxVolume: 2000,
            minProfit: 0.5,
            buyExchanges: [],
            sellExchanges: []
        },
        sort: {
            field: 'spread',
            direction: 'desc'
        },
        summary: {
            totalOpportunities: 0,
            avgSpread: 0,
            totalVolume: 0,
            lastUpdateTime: new Date().toISOString()
        },
        total: 0
    }),

    actions: {
        async fetchOpportunities() {
            try {
                const response = await $fetch('/api/scanner', {
                    params: {
                        page: this.page,
                        limit: this.limit,
                        ...this.filters
                    }
                })
                this.opportunities = response.results
                this.summary = response.summary
                this.total = response.pagination.total
            } catch (error) {
                console.error('Fetch error:', error)
            }
        },

        updatePrices(updates) {
            updates.forEach(update => {
                const opportunity = this.opportunities.find(o =>
                    o.coin === update.pair &&
                    (o.buyExchange === update.exchange || o.sellExchange === update.exchange)
                )
                if (opportunity) {
                    if (opportunity.buyExchange === update.exchange) {
                        opportunity.buyPrice = update.price
                    } else {
                        opportunity.sellPrice = update.price
                    }
                    opportunity.spread = calculateSpread(opportunity.buyPrice, opportunity.sellPrice)
                    opportunity.profit = calculateProfit(opportunity)
                }
            })
        }
    }
})
