// server/middleware/websocket.ts
import { WebSocketServer } from 'ws'

let wss: WebSocketServer

export default defineEventHandler((event) => {
    if (!wss) {
        wss = new WebSocketServer({ port: 3001 })

        wss.on('connection', (ws) => {
            console.log('Client connected')

            setInterval(() => {
                const updates = generatePriceUpdates()
                ws.send(JSON.stringify({
                    type: 'price_updates',
                    data: updates
                }))
            }, 5000)
        })
    }
})

function generatePriceUpdates() {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    const exchanges = ['Binance', 'Bybit', 'KuCoin']

    return pairs.flatMap(pair =>
        exchanges.map(exchange => ({
            pair,
            exchange,
            price: getRandomPrice(pair),
            timestamp: Date.now()
        }))
    )
}

function getRandomPrice(pair: string) {
    const basePrice = {
        'BTC/USDT': 45000,
        'ETH/USDT': 2500,
        'SOL/USDT': 100
    }[pair] || 100

    return +(basePrice + (Math.random() - 0.5) * basePrice * 0.01).toFixed(2)
}
