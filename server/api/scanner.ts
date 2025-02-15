import { getQuery } from 'h3'

interface QueryParams {
    page?: number
    limit?: number
    minVolume?: number
    maxVolume?: number
    minProfit?: number
    buyExchanges?: string[]
    sellExchanges?: string[]
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as QueryParams
    const {
        page = 1,
        limit = 50,
        minVolume,
        maxVolume,
        minProfit,
        buyExchanges,
        sellExchanges
    } = query

    // Генерируем больше данных
    const allOpportunities = generateManyOpportunities(100)

    // Применяем фильтры
    const filtered = allOpportunities.filter(opp => {
        if (minVolume && opp.volume < Number(minVolume)) return false
        if (maxVolume && opp.volume > Number(maxVolume)) return false
        if (minProfit && opp.profit < Number(minProfit)) return false
        if (buyExchanges && !buyExchanges.includes(opp.buyExchange)) return false
        if (sellExchanges && !sellExchanges.includes(opp.sellExchange)) return false
        return true
    })

    // Пагинация
    const start = (Number(page) - 1) * Number(limit)
    const results = filtered.slice(start, start + Number(limit))

    return {
        results,
        summary: {
            totalOpportunities: filtered.length,
            avgSpread: calculateAvgSpread(filtered),
            totalVolume: calculateTotalVolume(filtered),
            lastUpdateTime: new Date().toISOString()
        },
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filtered.length
        }
    }
})

function generateManyOpportunities(count: number) {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'MATIC/USDT']
    const exchanges = ['Binance', 'Bybit', 'KuCoin', 'OKX', 'Bitget', 'Huobi', 'Gate.io', 'Kraken']

    return Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        coin: pairs[Math.floor(Math.random() * pairs.length)],
        buyExchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        sellExchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        spread: +(Math.random() * 2).toFixed(2),
        volume: Math.floor(Math.random() * 100000) + 10000,
        profit: Math.floor(Math.random() * 1000) + 100,
        buyPrice: +(Math.random() * 50000).toFixed(2),
        sellPrice: +(Math.random() * 50000).toFixed(2),
        lastUpdate: new Date().toISOString()
    }))
}

function calculateAvgSpread(opportunities: any[]): number {
    if (!opportunities.length) return 0
    const sum = opportunities.reduce((acc, opp) => acc + opp.spread, 0)
    return +(sum / opportunities.length).toFixed(2)
}

function calculateTotalVolume(opportunities: any[]): number {
    return opportunities.reduce((acc, opp) => acc + opp.volume, 0)
}

interface Opportunity {
    id: number
    coin: string
    buyExchange: string
    sellExchange: string
    spread: number
    volume: number
    profit: number
    buyPrice: number
    sellPrice: number
    lastUpdate: string
}

