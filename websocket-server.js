import { WebSocketServer } from 'ws'

/**
 * WebSocket сервер для эмуляции обновления цен в реальном времени
 * 
 * Основные функции:
 * 1. Генерация случайных изменений цен для монет
 * 2. Отправка обновлений цен подключенным клиентам
 * 3. Управление периодом обновления цен
 * 4. Поддержание актуального состояния цен
 */

const wss = new WebSocketServer({ 
    port: 3001,
    path: "/ws"  // Explicitly set the WebSocket path
})

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

const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'Huobi']

// Map для хранения последних цен для каждой монеты на каждой бирже
// Ключ формата "BTC-Binance", значение - текущая цена
const lastPrices = new Map()

/**
 * Инициализация начальных цен для всех монет на всех биржах
 * Устанавливает базовые цены из конфигурации COINS
 */
function initializeLastPrices() {
    for (const [coin, { base }] of Object.entries(COINS)) {
        for (const exchange of EXCHANGES) {
            const key = `${coin}-${exchange}`
            lastPrices.set(key, base)
        }
    }
}

/**
 * Генерация следующей цены с учетом ограничений
 * 
 * Алгоритм:
 * 1. Рассчитывает максимальное изменение (±0.5% от базовой цены)
 * 2. Генерирует случайное изменение в этих пределах
 * 3. Ограничивает итоговую цену в диапазоне ±2% от базовой цены
 * 
 * @param {number} currentPrice - Текущая цена
 * @param {string} coin - Монета (например, 'BTC')
 * @returns {number} Новая цена
 */
function getNextPrice(currentPrice, coin) {
    const { base } = COINS[coin]
    // Максимальное изменение ±0.5% от базовой цены
    const maxChange = base * 0.005
    const change = (Math.random() - 0.5) * maxChange
    const newPrice = currentPrice + change
    
    // Ограничиваем колебания в пределах ±2% от базовой цены
    const minPrice = base * 0.98
    const maxPrice = base * 1.02
    return Math.min(Math.max(newPrice, minPrice), maxPrice)
}

/**
 * Генерация пакета обновлений цен
 * 
 * Процесс:
 * 1. Выбирает случайные 20% монет для обновления
 * 2. Для каждой монеты обновляет цены на 2-3 случайных биржах
 * 3. Генерирует новые цены с помощью getNextPrice
 * 4. Формирует массив обновлений с метками времени
 * 
 * @returns {Array} Массив обновлений цен
 */
function generatePriceUpdates() {
    const updates = []
    
    // Обновляем 20% монет на каждой бирже
    const coinsToUpdate = Math.ceil(Object.keys(COINS).length * 0.2)
    const selectedCoins = Object.keys(COINS)
        .sort(() => Math.random() - 0.5)
        .slice(0, coinsToUpdate)

    for (const coin of selectedCoins) {
        // Обновляем цены на 2-3 случайных биржах для каждой монеты
        const exchangesToUpdate = EXCHANGES
            .sort(() => Math.random() - 0.5)
            .slice(0, 2 + Math.floor(Math.random() * 2))

        for (const exchange of exchangesToUpdate) {
            const key = `${coin}-${exchange}`
            const currentPrice = lastPrices.get(key)
            const newPrice = getNextPrice(currentPrice, coin)
            lastPrices.set(key, newPrice)

            updates.push({
                pair: coin, // Оставляем поле pair для совместимости, но используем монету
                exchange,
                price: +newPrice.toFixed(8), // Увеличиваем точность для мелких монет
                timestamp: Date.now()
            })
        }
    }

    return updates
}

// Инициализируем начальные цены
initializeLastPrices()

/**
 * Обработка WebSocket подключений
 * 
 * Действия при подключении клиента:
 * 1. Создание интервала отправки обновлений
 * 2. Обработка изменений периода обновления
 * 3. Очистка ресурсов при отключении
 */
wss.on('connection', (ws) => {
    console.log('Клиент подключен')
    
    let intervalId = null
    let updatePeriod = 5 // По умолчанию 5 секунд

    /**
     * Запуск интервала отправки обновлений
     * @param {number} period - Период обновления в секундах
     */
    const startInterval = (period) => {
        // Очищаем предыдущий интервал если он существует
        if (intervalId) {
            clearInterval(intervalId)
        }

        // Создаем новый интервал с указанным периодом
        intervalId = setInterval(() => {
            const updates = generatePriceUpdates()
            ws.send(JSON.stringify({
                type: 'price_updates',
                data: updates
            }))
        }, period * 1000) // Конвертируем секунды в миллисекунды
    }

    // Запуск интервала с начальным периодом обновления
    startInterval(updatePeriod)

    // Обработка входящих сообщений от клиента
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message)
            if (data.type === 'set_update_period') {
                updatePeriod = parseInt(data.period)
                startInterval(updatePeriod)
                console.log(`Период обновления изменен на ${updatePeriod} секунд`)
            }
        } catch (error) {
            console.error('Message parsing error:', error)
        }
    })

    ws.on('close', () => {
        if (intervalId) {
            clearInterval(intervalId)
        }
        console.log('Клиент отключен')
    })

    ws.on('error', (error) => {
        if (intervalId) {
            clearInterval(intervalId)
        }
        console.error('WebSocket error:', error)
    })
})

// Handle HTTP upgrade requests
const server = wss.on('listening', () => {
    console.log('WebSocket сервер запущен на порту 3001')
}).on('error', (error) => {
    console.error('WebSocket server error:', error)
})

// Export the server instance
export default server
