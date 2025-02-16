import { getQuery } from 'h3'

/**
 * API эндпоинт /api/scanner
 * 
 * Предназначение:
 * - Генерация и фильтрация арбитражных возможностей
 * - Обработка параметров запроса для фильтрации данных
 * - Пагинация результатов
 * - Расчет сводной статистики
 */

/**
 * Интерфейс параметров запроса
 * Описывает возможные параметры фильтрации и пагинации
 */
interface QueryParams {
    page?: number
    limit?: number
    minVolume?: number
    maxVolume?: number
    minProfit?: number
    maxCommission?: number
    buyExchanges?: string[]
    sellExchanges?: string[]
    currencies?: string[]
}

/**
 * Конфигурация монет
 * base - базовая цена для генерации случайных цен
 * volume - базовый объем для генерации случайных объемов
 */
const COINS = {
    'BTC': { base: 45000, volume: 100000 },
    'ETH': { base: 2500, volume: 50000 },
    'SOL': { base: 100, volume: 25000 },
    'AVAX': { base: 35, volume: 20000 },
    'BNB': { base: 300, volume: 30000 },
    'XRP': { base: 0.5, volume: 15000 },
    'ADA': { base: 0.4, volume: 10000 },
    'MATIC': { base: 0.8, volume: 12000 },
    'DOT': { base: 7, volume: 18000 },
    'DOGE': { base: 0.08, volume: 8000 },
    'SHIB': { base: 0.00001, volume: 5000 },
    'LINK': { base: 15, volume: 20000 },
    'UNI': { base: 5, volume: 15000 },
    'ATOM': { base: 10, volume: 20000 },
    'TRX': { base: 0.08, volume: 10000 }
}

// Список поддерживаемых бирж
const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'Huobi']

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const {
        page = 1,
        limit = 50,
        minVolume,
        maxVolume,
        minProfit,
        maxCommission
    } = query

    // Получаем массивы бирж из query параметров
    const buyExchanges = Array.isArray(query.buyExchanges) 
        ? query.buyExchanges 
        : query.buyExchanges 
            ? [query.buyExchanges] 
            : []

    const sellExchanges = Array.isArray(query.sellExchanges)
        ? query.sellExchanges
        : query.sellExchanges
            ? [query.sellExchanges]
            : []

    const currencies = Array.isArray(query.currencies)
        ? query.currencies
        : query.currencies
            ? [query.currencies]
            : []

    // Генерируем данные
    const allOpportunities = generateManyOpportunities(200) // Увеличили количество генерируемых данных

    // Применяем фильтры
    const filtered = allOpportunities.filter(opp => {
        // Проверяем объем только если значения фильтров больше 0
        if (Number(minVolume) > 0 && opp.volume < Number(minVolume)) return false
        if (Number(maxVolume) > 0 && opp.volume > Number(maxVolume)) return false
        if (Number(minProfit) > 0 && opp.profit < Number(minProfit)) return false
        
        // Проверяем биржи только если они выбраны
        if (buyExchanges.length > 0 && !buyExchanges.includes(opp.buyExchange)) return false
        if (sellExchanges.length > 0 && !sellExchanges.includes(opp.sellExchange)) return false

        // Проверяем монеты только если они выбраны
        if (currencies.length > 0 && !currencies.includes(opp.coin)) return false
        
        // Проверяем спред если он указан в query параметрах
        const spread = query.spread ? Number(query.spread) : 0
        if (spread > 0 && opp.spread < spread) return false

        // Проверяем комиссию если она указана
        // Комиссия считается как процент от объема сделки (0.1% = 0.001)
        const commission = opp.volume * 0.001 // Предполагаем комиссию 0.1% с каждой стороны
        const totalCommission = commission * 2 // Умножаем на 2, так как комиссия берется и при покупке, и при продаже
        if (Number(maxCommission) > 0 && totalCommission > Number(maxCommission)) return false

        return true
    })

    // Сортировка по спреду по умолчанию
    filtered.sort((a, b) => b.spread - a.spread)

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

/**
 * Генерация случайной цены в пределах заданной вариации от базовой цены
 * @param basePrice - Базовая цена
 * @returns Сгенерированная цена с вариацией ±1%
 */
function generatePrice(basePrice: number): number {
    const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
    const price = basePrice * (1 + variation)
    return +price.toFixed(basePrice < 0.01 ? 8 : 2) // Больше десятичных знаков для мелких монет
}

/**
 * Генерация массива арбитражных возможностей
 * 
 * Процесс генерации:
 * 1. Для каждой возможности выбирается случайная монета
 * 2. Выбираются случайные биржи для покупки и продажи
 * 3. Генерируются цены с положительным спредом
 * 4. Рассчитываются объем, спред и прибыль
 * 
 * @param count - Количество возможностей для генерации
 * @returns Массив сгенерированных возможностей
 */
function generateManyOpportunities(count: number) {
    const opportunities: Opportunity[] = []
    const coins = Object.entries(COINS)

    for (let i = 0; i < count; i++) {
        const [coin, { base: basePrice, volume: baseVolume }] = coins[i % coins.length]
        const buyExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)]
        let sellExchange
        do {
            sellExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)]
        } while (sellExchange === buyExchange)

        // Generate prices ensuring positive spread
        let buyPrice = generatePrice(basePrice)
        // Ensure sell price is higher than buy price for positive spread
        let sellPrice = buyPrice * (1 + (0.001 + Math.random() * 0.019)) // Spread between 0.1% and 2%
        
        const volume = +(baseVolume * (0.8 + Math.random() * 0.4)).toFixed(2) // ±20% от базового объема
        const spread = +((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)
        
        // Calculate actual profit/loss in USDT
        // For volume in USDT, we need to convert it to base currency units first
        const baseUnits = volume / buyPrice // How many units of the base currency we can buy
        const profit = +((sellPrice - buyPrice) * baseUnits).toFixed(2) // Profit/loss in USDT

        opportunities.push({
            id: i + 1,
            coin,
            buyExchange,
            sellExchange,
            spread,
            volume,
            profit,
            buyPrice,
            sellPrice,
            lastUpdate: new Date().toISOString()
        })
    }

    return opportunities
}

/**
 * Расчет среднего спреда по всем возможностям
 * @param opportunities - Массив возможностей
 * @returns Средний спред в процентах
 */
function calculateAvgSpread(opportunities: any[]): number {
    if (!opportunities.length) return 0
    const sum = opportunities.reduce((acc, opp) => acc + opp.spread, 0)
    return +(sum / opportunities.length).toFixed(2)
}

/**
 * Расчет общего объема всех возможностей
 * @param opportunities - Массив возможностей
 * @returns Суммарный объем в USDT
 */
function calculateTotalVolume(opportunities: any[]): number {
    return opportunities.reduce((acc, opp) => acc + opp.volume, 0)
}

/**
 * Интерфейс арбитражной возможности
 * Описывает структуру данных для каждой сгенерированной возможности
 */
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
