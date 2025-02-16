// server/api/dashboard.ts
export interface Balance {
    currency: string;
    amount: number;
}

export interface Exchange {
    name: string;
    lastUpdate: string;
    balances: Balance[];
}

export interface Deal {
    id: number;
    date: string;
    pair: string;
    buyExchange: string;
    sellExchange: string;
    buyPrice: number;
    sellPrice: number;
    volume: number;
    spread: number;
    profit: number;
    commission: number;
    status: string;
}

export interface Metrics {
    totalProfit: number;
    dailyProfit: number;
    successRate: number;
    activeDeals: number;
    volume24h: number;
    avgSpread: number;
}

export interface DashboardState {
    history: Deal[];
    exchanges: Exchange[];
    metrics: Metrics;
}

// Начальные значения балансов
export const initialExchangeState = {
    exchanges: [
        {
            name: 'Binance',
            lastUpdate: new Date().toISOString(),
            balances: [
                { currency: 'USDT', amount: 1000 },
                { currency: 'BTC', amount: 0 },
                { currency: 'ETH', amount: 0 },
                { currency: 'SOL', amount: 0 },
                { currency: 'AVAX', amount: 0 },
                { currency: 'BNB', amount: 0 },
                { currency: 'XRP', amount: 0 },
                { currency: 'ADA', amount: 0 },
                { currency: 'MATIC', amount: 0 },
                { currency: 'DOT', amount: 0 },
                { currency: 'DOGE', amount: 0 },
                { currency: 'SHIB', amount: 0 },
                { currency: 'LINK', amount: 0 },
                { currency: 'UNI', amount: 0 },
                { currency: 'ATOM', amount: 0 },
                { currency: 'TRX', amount: 0 }
            ]
        },
        {
            name: 'Bybit',
            lastUpdate: new Date().toISOString(),
            balances: [
                { currency: 'USDT', amount: 1000 },
                { currency: 'BTC', amount: 0 },
                { currency: 'ETH', amount: 0 },
                { currency: 'SOL', amount: 0 },
                { currency: 'AVAX', amount: 0 },
                { currency: 'BNB', amount: 0 },
                { currency: 'XRP', amount: 0 },
                { currency: 'ADA', amount: 0 },
                { currency: 'MATIC', amount: 0 },
                { currency: 'DOT', amount: 0 },
                { currency: 'DOGE', amount: 0 },
                { currency: 'SHIB', amount: 0 },
                { currency: 'LINK', amount: 0 },
                { currency: 'UNI', amount: 0 },
                { currency: 'ATOM', amount: 0 },
                { currency: 'TRX', amount: 0 }
            ]
        },
        {
            name: 'OKX',
            lastUpdate: new Date().toISOString(),
            balances: [
                { currency: 'USDT', amount: 1000 },
                { currency: 'BTC', amount: 0 },
                { currency: 'ETH', amount: 0 },
                { currency: 'SOL', amount: 0 },
                { currency: 'AVAX', amount: 0 },
                { currency: 'BNB', amount: 0 },
                { currency: 'XRP', amount: 0 },
                { currency: 'ADA', amount: 0 },
                { currency: 'MATIC', amount: 0 },
                { currency: 'DOT', amount: 0 },
                { currency: 'DOGE', amount: 0 },
                { currency: 'SHIB', amount: 0 },
                { currency: 'LINK', amount: 0 },
                { currency: 'UNI', amount: 0 },
                { currency: 'ATOM', amount: 0 },
                { currency: 'TRX', amount: 0 }
            ]
        },
        {
            name: 'Huobi',
            lastUpdate: new Date().toISOString(),
            balances: [
                { currency: 'USDT', amount: 1000 },
                { currency: 'BTC', amount: 0 },
                { currency: 'ETH', amount: 0 },
                { currency: 'SOL', amount: 0 },
                { currency: 'AVAX', amount: 0 },
                { currency: 'BNB', amount: 0 },
                { currency: 'XRP', amount: 0 },
                { currency: 'ADA', amount: 0 },
                { currency: 'MATIC', amount: 0 },
                { currency: 'DOT', amount: 0 },
                { currency: 'DOGE', amount: 0 },
                { currency: 'SHIB', amount: 0 },
                { currency: 'LINK', amount: 0 },
                { currency: 'UNI', amount: 0 },
                { currency: 'ATOM', amount: 0 },
                { currency: 'TRX', amount: 0 }
            ]
        }
    ]
}

// Начальное состояние дашборда
export const dashboardState: DashboardState = {
    history: [],
    exchanges: JSON.parse(JSON.stringify(initialExchangeState.exchanges)),
    metrics: {
        totalProfit: 0,
        dailyProfit: 0,
        successRate: 0,
        activeDeals: 0,
        volume24h: 0,
        avgSpread: 0
    }
}

// Обновляем метрики
export const updateMetrics = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentDeals = dashboardState.history.filter(d => new Date(d.date) > oneDayAgo)

    dashboardState.metrics = {
        totalProfit: dashboardState.history.reduce((sum, d) => sum + d.profit - d.commission, 0),
        dailyProfit: recentDeals.reduce((sum, d) => sum + d.profit - d.commission, 0),
        successRate: Math.round((dashboardState.history.filter(d => d.profit > d.commission).length / dashboardState.history.length) * 100) || 0,
        activeDeals: 0,
        volume24h: recentDeals.reduce((sum, d) => sum + d.volume, 0),
        avgSpread: recentDeals.length ? recentDeals.reduce((sum, d) => sum + d.spread, 0) / recentDeals.length : 0
    }
}

// Инициализируем метрики
updateMetrics()

// Обработчик добавления новой сделки
export const addDeal = (deal: Deal) => {
    // Добавляем сделку в историю
    dashboardState.history.push({
        ...deal,
        date: new Date().toISOString()
    })

    // Обновляем балансы бирж
    const buyExchange = dashboardState.exchanges.find(e => e.name === deal.buyExchange)
    const sellExchange = dashboardState.exchanges.find(e => e.name === deal.sellExchange)

    if (buyExchange && sellExchange) {
        // Рассчитываем количество монет для сделки
        const coinAmount = deal.volume / deal.buyPrice
        
        // Обновляем баланс покупающей биржи
        const buyUSDT = buyExchange.balances.find(b => b.currency === 'USDT')
        const buyCoin = buyExchange.balances.find(b => b.currency === deal.pair)
        
        if (buyUSDT && buyCoin) {
            // Уменьшаем USDT на объем покупки
            buyUSDT.amount = +(buyUSDT.amount - deal.volume).toFixed(4)
            // Увеличиваем баланс купленной монеты
            buyCoin.amount = +(buyCoin.amount + coinAmount).toFixed(8)
        }

        // Обновляем баланс продающей биржи
        const sellUSDT = sellExchange.balances.find(b => b.currency === 'USDT')
        const sellCoin = sellExchange.balances.find(b => b.currency === deal.pair)
        
        if (sellUSDT && sellCoin) {
            // Увеличиваем USDT от продажи
            const sellAmount = deal.volume * (1 + deal.spread / 100)
            sellUSDT.amount = +(sellUSDT.amount + sellAmount).toFixed(4)
            // Уменьшаем баланс проданной монеты
            sellCoin.amount = +(sellCoin.amount - coinAmount).toFixed(8)
        }

        // Обновляем время последнего обновления
        buyExchange.lastUpdate = new Date().toISOString()
        sellExchange.lastUpdate = new Date().toISOString()
    }

    // Обновляем метрики
    updateMetrics()
}

// Сброс состояния дашборда
export const resetDashboardState = () => {
    // Создаем полностью новое состояние
    const newState: DashboardState = {
        history: [],
        exchanges: JSON.parse(JSON.stringify(initialExchangeState.exchanges)),
        metrics: {
            totalProfit: 0,
            dailyProfit: 0,
            successRate: 0,
            activeDeals: 0,
            volume24h: 0,
            avgSpread: 0
        }
    }
    
    // Обновляем время для каждой биржи
    newState.exchanges.forEach(exchange => {
        exchange.lastUpdate = new Date().toISOString()
    })
    
    // Полностью заменяем текущее состояние новым
    Object.assign(dashboardState, newState)
}

// Импортируем необходимые утилиты
import { defineEventHandler, createError, readBody, setResponseHeader, getRequestHeaders } from 'h3'

// Отдельный обработчик для reset endpoint
export default defineEventHandler(async (event) => {
    try {
        // Устанавливаем заголовок Content-Type как application/json для всех ответов
        setResponseHeader(event, 'Content-Type', 'application/json')

        const method = event.method
        const path = event.path?.replace('/api/dashboard', '') || ''

        // Если это POST запрос с новой сделкой
        if (method === 'POST' && path === '') {
            const body = await readBody(event)
            addDeal(body as Deal)
            return { success: true }
        }

        // Если это GET запрос
        if (method === 'GET' && path === '') {
            // Генерируем случайные активные сделки
            const activeDeals = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                pair: ['BTC', 'ETH', 'SOL', 'AVAX', 'BNB'][Math.floor(Math.random() * 5)],
                amount: Math.random() * 1000,
                profit: Math.random() * 100,
                exchanges: ['Binance → Bybit', 'Huobi → OKX'][Math.floor(Math.random() * 2)],
                status: ['В процессе', 'Ожидание'][Math.floor(Math.random() * 2)]
            }))

            // Возвращаем текущее состояние
            return {
                history: dashboardState.history,
                exchanges: dashboardState.exchanges,
                metrics: dashboardState.metrics,
                profitChart: Array.from({ length: 7 }, (_, i) => ({
                    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                    value: Math.random() * 1000
                })).reverse(),
                activeDeals
            }
        }

        // Если путь не соответствует ни одному из обработчиков
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found'
        })
    } catch (error: any) {
        // Обработка ошибок
        console.error('Dashboard API Error:', error)
        
        // Устанавливаем заголовок Content-Type для ошибок
        setResponseHeader(event, 'Content-Type', 'application/json')
        
        if (error.statusCode && error.statusMessage) {
            // Если это уже H3 ошибка, пробрасываем её дальше
            throw error
        }
        
        // Создаем новую H3 ошибку
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error'
        })
    }
})
