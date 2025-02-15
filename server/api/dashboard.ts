// server/api/dashboard.ts
export default defineEventHandler(() => ({
    metrics: {
        totalProfit: 1234.56,
        dailyProfit: 234.12,
        successRate: 89,
        activeDeals: 5,
        volume24h: 25678.90,
        avgSpread: 1.2
    },
    profitChart: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        value: Math.random() * 1000
    })).reverse(),
    activeDeals: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'][Math.floor(Math.random() * 3)],
        amount: Math.random() * 1000,
        profit: Math.random() * 100,
        exchanges: ['Binance → Bybit', 'Huobi → OKX'][Math.floor(Math.random() * 2)],
        status: ['В процессе', 'Ожидание'][Math.floor(Math.random() * 2)]
    }))
}))
