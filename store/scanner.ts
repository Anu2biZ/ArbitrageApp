import { defineStore } from 'pinia'
import { useDashboard } from '../composables/useDashboard'

/**
 * Хранилище для управления данными межбиржевого сканера
 * 
 * Основные функции:
 * 1. Хранение и управление арбитражными возможностями
 * 2. Фильтрация и сортировка данных
 * 3. Обновление цен в реальном времени
 * 4. Расчет спредов и прибыли
 * 5. Управление пагинацией
 */

/**
 * Интерфейс арбитражной возможности
 * Описывает структуру данных для каждой найденной возможности
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

/**
 * Интерфейс обновления цены
 * Используется для обработки WebSocket обновлений
 */
interface PriceUpdate {
    pair: string
    exchange: string
    price: number
    timestamp: number
}

/**
 * Интерфейс сводной информации
 * Содержит агрегированные данные по всем возможностям
 */
interface Summary {
    totalOpportunities: number
    avgSpread: number
    totalVolume: number
    lastUpdateTime: string
}

/**
 * Конфигурация монет
 * Содержит базовые цены и объемы для основных монет
 * base - примерная базовая цена для расчета профита
 * volume - стандартный объем торгов
 */
export const COINS = {
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
} as const

export const useScannerStore = defineStore('scanner', {
    state: () => ({
        // Массив найденных арбитражных возможностей
        opportunities: [] as Opportunity[],
        page: 1,
        limit: 50,
        // Параметры фильтрации и настройки сканера
        filters: {
            minVolume: 0,
            maxVolume: 0,
            minProfit: 0,
            buyExchanges: [] as string[],
            sellExchanges: [] as string[],
            spread: 0,
            maxCommission: 0,
            updatePeriod: 5,
            currencies: [] as string[]
        },
        // Параметры сортировки результатов
        sort: {
            field: 'spread' as keyof Opportunity,
            direction: 'desc' as 'asc' | 'desc'
        },
        summary: {
            totalOpportunities: 0,
            avgSpread: 0,
            totalVolume: 0,
            lastUpdateTime: new Date().toISOString()
        } as Summary,
        total: 0,
        // Добавляем начальные балансы для отслеживания динамики
        initialBalances: {} as Record<string, Record<string, number>>,
        sessionStartTime: new Date().toISOString()
    }),

    actions: {
        async fetchOpportunities() {
            try {
                const queryParams = new URLSearchParams({
                    page: this.page.toString(),
                    limit: this.limit.toString(),
                    minVolume: this.filters.minVolume.toString(),
                    maxVolume: this.filters.maxVolume.toString(),
                    minProfit: this.filters.minProfit.toString(),
                    spread: this.filters.spread.toString(),
                    maxCommission: this.filters.maxCommission.toString(),
                    updatePeriod: this.filters.updatePeriod.toString(),
                })

                if (this.filters.buyExchanges.length) {
                    this.filters.buyExchanges.forEach(exchange => 
                        queryParams.append('buyExchanges', exchange)
                    )
                }
                if (this.filters.sellExchanges.length) {
                    this.filters.sellExchanges.forEach(exchange => 
                        queryParams.append('sellExchanges', exchange)
                    )
                }

                if (this.filters.currencies.length) {
                    this.filters.currencies.forEach(currency => 
                        queryParams.append('currencies', currency)
                    )
                }

                const response = await fetch(`/api/scanner?${queryParams.toString()}`).then(res => res.json())
                
                this.opportunities = response.results
                this.summary = response.summary
                this.total = response.pagination.total
            } catch (error) {
                console.error('Fetch error:', error)
            }
        },

        calculateSpread(buyPrice: number, sellPrice: number): number {
            return +((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)
        },

        calculateProfit(opportunity: Opportunity): number {
            const { buyPrice, sellPrice, volume, coin } = opportunity
            const coinData = COINS[coin as keyof typeof COINS]
            return +((sellPrice - buyPrice) * volume / coinData.base).toFixed(2)
        },

        // Сохраняем начальные балансы при старте сессии
        initializeSession(exchanges: { name: string, balances: { currency: string, amount: number }[] }[]) {
            // Проверяем есть ли сохраненные балансы
            const savedBalances = localStorage.getItem('initialBalances')
            const savedSessionTime = localStorage.getItem('sessionStartTime')
            
            if (!savedBalances || !savedSessionTime) {
                // Если нет сохраненных данных, инициализируем новую сессию
                this.sessionStartTime = new Date().toISOString()
                this.initialBalances = {}
                
                exchanges.forEach(exchange => {
                    this.initialBalances[exchange.name] = {}
                    exchange.balances.forEach(balance => {
                        this.initialBalances[exchange.name][balance.currency] = balance.amount
                    })
                })
                
                // Сохраняем в localStorage
                localStorage.setItem('initialBalances', JSON.stringify(this.initialBalances))
                localStorage.setItem('sessionStartTime', this.sessionStartTime)
            } else {
                // Используем сохраненные данные
                this.initialBalances = JSON.parse(savedBalances)
                this.sessionStartTime = savedSessionTime
            }
        },

        // Вычисляем изменение баланса с начала сессии
        calculateBalanceChange(exchange: string, currency: string, currentAmount: number): number {
            if (!this.initialBalances[exchange] || typeof this.initialBalances[exchange][currency] === 'undefined') {
                return 0
            }
            const initialAmount = this.initialBalances[exchange][currency]
            const change = currentAmount - initialAmount
            
            // Для USDT возвращаем изменение в долларах как есть
            if (currency === 'USDT') {
                return Math.abs(change) < 0.0001 ? 0 : change
            }
            
            // Для других монет ищем базовую цену из конфигурации
            const coinData = COINS[currency as keyof typeof COINS]
            if (!coinData) return 0
            
            // Возвращаем изменение в долларах, используя базовую цену монеты
            const usdChange = change * coinData.base
            return Math.abs(usdChange) < 0.0001 ? 0 : usdChange
        },

        async startArbitrage(opportunity: Opportunity) {
            try {
                this.opportunities = this.opportunities.filter(o => o.id !== opportunity.id)
                this.summary.totalOpportunities = this.opportunities.length
                
                // Рассчитываем комиссию
                const commission = opportunity.volume * 0.002 // 0.2% комиссия
                const netProfit = opportunity.profit - commission

                // Создаем объект сделки с учетом комиссии
                const deal = {
                    id: Date.now(),
                    date: new Date().toISOString(),
                    pair: opportunity.coin,
                    buyExchange: opportunity.buyExchange,
                    sellExchange: opportunity.sellExchange,
                    buyPrice: opportunity.buyPrice,
                    sellPrice: opportunity.sellPrice,
                    volume: opportunity.volume,
                    spread: opportunity.spread,
                    profit: netProfit,
                    commission,
                    status: 'Завершено'
                }

                const response = await $fetch<{ success: boolean }>('/api/dashboard', {
                    method: 'POST',
                    body: deal
                })

                if (!response?.success) {
                    throw new Error('Failed to save deal')
                }
                
                // Создаем событие для уведомления

                window.dispatchEvent(new CustomEvent('arbitrage-notification', {
                    detail: {
                        type: 'success',
                        message: `Сделка выполнена успешно! Прибыль: $${netProfit.toFixed(2)} (с учетом комиссии $${commission.toFixed(2)})`
                    }
                }))
                
            } catch (error) {
                console.error('Error executing arbitrage:', error)
                window.dispatchEvent(new CustomEvent('arbitrage-notification', {
                    detail: {
                        type: 'error',
                        message: 'Не удалось выполнить арбитражную сделку'
                    }
                }))
            }
        },

        updatePrices(updates: PriceUpdate[]) {
            let needsRefetch = false;

            updates.forEach(update => {
                const opportunities = this.opportunities.filter(o =>
                    o.coin === update.pair &&
                    (o.buyExchange === update.exchange || o.sellExchange === update.exchange)
                )

                opportunities.forEach(opportunity => {
                    if (opportunity.buyExchange === update.exchange) {
                        opportunity.buyPrice = update.price
                    } else if (opportunity.sellExchange === update.exchange) {
                        opportunity.sellPrice = update.price
                    }

                    const newSpread = this.calculateSpread(opportunity.buyPrice, opportunity.sellPrice)
                    const newProfit = this.calculateProfit(opportunity)

                    if (
                        (this.filters.spread > 0 && newSpread < this.filters.spread) ||
                        (this.filters.minProfit > 0 && newProfit < this.filters.minProfit)
                    ) {
                        needsRefetch = true;
                    }

                    opportunity.spread = newSpread;
                    opportunity.profit = newProfit;
                    opportunity.lastUpdate = new Date().toISOString()
                })
            })

            if (needsRefetch) {
                this.fetchOpportunities()
            }

            const totalSpread = this.opportunities.reduce((acc, opp) => acc + Number(opp.spread || 0), 0)
            const avgSpread = this.opportunities.length > 0 ? totalSpread / this.opportunities.length : 0
            
            this.summary = {
                totalOpportunities: this.opportunities.length,
                avgSpread: +avgSpread.toFixed(2),
                totalVolume: this.opportunities.reduce((acc, opp) => acc + Number(opp.volume || 0), 0),
                lastUpdateTime: new Date().toISOString()
            }

            if (this.sort.field) {
                this.opportunities.sort((a, b) => {
                    const aValue = Number(a[this.sort.field] || 0)
                    const bValue = Number(b[this.sort.field] || 0)
                    const direction = this.sort.direction === 'asc' ? 1 : -1
                    return (aValue - bValue) * direction
                })
            }
        }
    }
})
