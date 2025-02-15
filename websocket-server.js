import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3001 })

function getRandomPrice(pair) {
    const basePrices = {
        'BTC/USDT': 45000,
        'ETH/USDT': 2500,
        'SOL/USDT': 100
    }
    const basePrice = basePrices[pair] || 100
    return +(basePrice + (Math.random() - 0.5) * basePrice * 0.01).toFixed(2)
}

function calculateSpread(buyPrice, sellPrice) {
    return +((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)
}

function calculateProfit(volume, buyPrice, sellPrice) {
    return +((sellPrice - buyPrice) * volume).toFixed(2)
}

function generatePriceUpdates() {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    const exchanges = ['Binance', 'Bybit', 'KuCoin']

    return pairs.flatMap(pair =>
        exchanges.map(exchange => ({
            pair,
            exchange,
            price: getRandomPrice(pair),
            timestamp: Date.now(),
            type: Math.random() > 0.5 ? 'buy' : 'sell'
        }))
    )
}

wss.on('connection', (ws) => {
    console.log('Client connected')
    setInterval(() => {
        ws.send(JSON.stringify({
            type: 'price_updates',
            data: generatePriceUpdates()
        }))
    }, 5000)
})
