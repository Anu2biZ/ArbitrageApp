import { WebSocketServer } from 'ws'

/**
 * WebSocket сервер для эмуляции обновления цен в реальном времени
 * 
 * Основные функции:
 * 1. Генерация случайных изменений цен для торговых пар
 * 2. Отправка обновлений цен подключенным клиентам
 * 3. Управление периодом обновления цен
 * 4. Поддержание актуального состояния цен
 */

const wss = new WebSocketServer({ port: 3001 })

const PAIRS = {
    'BTC/USDT': { base: 45000, volume: 100000 },
    'ETH/USDT': { base: 2500, volume: 50000 },
    'SOL/USDT': { base: 100, volume: 25000 },
    'AVAX/USDT': { base: 35, volume: 20000 },
    'BNB/USDT': { base: 300, volume: 30000 },
    'XRP/USDT': { base: 0.5, volume: 15000 },
    'ADA/USDT': { base: 0.4, volume: 10000 },
    'MATIC/USDT': { base: 0.8, volume: 12000 }
}

const EXCHANGES = ['Binance', 'Bybit', 'KuCoin', 'OKX', 'Bitget', 'Huobi', 'Gate.io', 'Kraken']

// Map для хранения последних цен для каждой пары на каждой бирже
// Ключ формата "BTC/USDT-Binance", значение - текущая цена
const lastPrices = new Map()

/**
 * Инициализация начальных цен для всех пар на всех биржах
 * Устанавливает базовые цены из конфигурации PAIRS
 */
function initializeLastPrices() {
    for (const [pair, { base }] of Object.entries(PAIRS)) {
        for (const exchange of EXCHANGES) {
            const key = `${pair}-${exchange}`
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
 * @param {string} pair - Торговая пара (например, 'BTC/USDT')
 * @returns {number} Новая цена
 */
function getNextPrice(currentPrice, pair) {
    const { base } = PAIRS[pair]
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
 * 1. Выбирает случайные 20% пар для обновления
 * 2. Для каждой пары обновляет цены на 2-3 случайных биржах
 * 3. Генерирует новые цены с помощью getNextPrice
 * 4. Формирует массив обновлений с метками времени
 * 
 * @returns {Array} Массив обновлений цен
 */
function generatePriceUpdates() {
    const updates = []
    
    // Обновляем 20% пар на каждой бирже
    const pairsToUpdate = Math.ceil(Object.keys(PAIRS).length * 0.2)
    const selectedPairs = Object.keys(PAIRS)
        .sort(() => Math.random() - 0.5)
        .slice(0, pairsToUpdate)

    for (const pair of selectedPairs) {
        // Обновляем цены на 2-3 случайных биржах для каждой пары
        const exchangesToUpdate = EXCHANGES
            .sort(() => Math.random() - 0.5)
            .slice(0, 2 + Math.floor(Math.random() * 2))

        for (const exchange of exchangesToUpdate) {
            const key = `${pair}-${exchange}`
            const currentPrice = lastPrices.get(key)
            const newPrice = getNextPrice(currentPrice, pair)
            lastPrices.set(key, newPrice)

            updates.push({
                pair,
                exchange,
                price: +newPrice.toFixed(2),
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

console.log('WebSocket сервер запущен на порту 3001')
