import { defineStore } from 'pinia'

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
 * Конфигурация торговых пар
 * Содержит базовые цены и объемы для основных торговых пар
 * base - примерная базовая цена для расчета профита
 * volume - стандартный объем торгов
 */
export const PAIRS = {
    'BTC/USDT': { base: 45000, volume: 100000 },
    'ETH/USDT': { base: 2500, volume: 50000 },
    'SOL/USDT': { base: 100, volume: 25000 },
    'AVAX/USDT': { base: 35, volume: 20000 },
    'BNB/USDT': { base: 300, volume: 30000 },
    'XRP/USDT': { base: 0.5, volume: 15000 },
    'ADA/USDT': { base: 0.4, volume: 10000 },
    'MATIC/USDT': { base: 0.8, volume: 12000 }
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
            updatePeriod: 5, // оставляем 5 секунд, так как это совпадает с реальным обновлением в сокетах
            currencies: [] as string[] // Добавляем фильтр валют
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
        total: 0
    }),

    actions: {
        /**
         * Загрузка арбитражных возможностей с сервера
         * 
         * Процесс:
         * 1. Формирование параметров запроса из текущих фильтров
         * 2. Отправка GET запроса на /api/scanner
         * 3. Обновление состояния store новыми данными
         */
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

        /**
         * Расчет процента спреда между ценами
         * @param buyPrice - Цена покупки
         * @param sellPrice - Цена продажи
         * @returns Процент спреда
         */
        calculateSpread(buyPrice: number, sellPrice: number): number {
            return +((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)
        },

        /**
         * Расчет прибыли для конкретной возможности
         * Учитывает объем и базовую цену пары
         * @param opportunity - Объект возможности
         * @returns Расчетная прибыль
         */
        calculateProfit(opportunity: Opportunity): number {
            const { buyPrice, sellPrice, volume, coin } = opportunity
            const pair = PAIRS[coin as keyof typeof PAIRS]
            return +((sellPrice - buyPrice) * volume / pair.base).toFixed(2)
        },

        /**
         * Обновление цен в реальном времени
         * 
         * Процесс:
         * 1. Обработка массива обновлений цен
         * 2. Обновление затронутых возможностей
         * 3. Пересчет спредов и прибыли
         * 4. Проверка на соответствие фильтрам
         * 5. Обновление сводной информации
         * 6. Сортировка результатов
         * 
         * @param updates - Массив обновлений цен
         */
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

                    // Проверяем, нужно ли обновить данные из-за фильтров
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

            // Перезапрашиваем данные только если значения вышли за пределы фильтров
            if (needsRefetch) {
                this.fetchOpportunities()
            }

            // Обновляем summary
            const totalSpread = this.opportunities.reduce((acc, opp) => acc + Number(opp.spread || 0), 0)
            const avgSpread = this.opportunities.length > 0 ? totalSpread / this.opportunities.length : 0
            
            this.summary = {
                totalOpportunities: this.opportunities.length,
                avgSpread: +avgSpread.toFixed(2),
                totalVolume: this.opportunities.reduce((acc, opp) => acc + Number(opp.volume || 0), 0),
                lastUpdateTime: new Date().toISOString()
            }

            // Сортируем возможности если нужно
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
