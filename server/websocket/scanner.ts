// server/websocket/scanner.ts
let connections = new Set()

interface Coin {
    base: number
    volume: number
}

interface CoinMap {
    [key: string]: Coin
}

interface WebSocketPeer {
    send: (data: any) => void
}

interface PriceUpdate {
    pair: string
    exchange: string
    price: number
    timestamp: number
}

const COINS: CoinMap = {
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

export default defineWebSocketHandler({
    open(peer: WebSocketPeer) {
        connections.add(peer)
        startPriceUpdates(peer)
    },
    close(peer: WebSocketPeer) {
        connections.delete(peer)
    }
})

function startPriceUpdates(peer: WebSocketPeer) {
    const coins = Object.keys(COINS)

    const interval = setInterval(() => {
        const updates: PriceUpdate[] = coins.flatMap(coin =>
            EXCHANGES.map(exchange => ({
                pair: coin, // Оставляем поле pair для совместимости
                exchange,
                price: getRandomPrice(coin),
                timestamp: Date.now()
            }))
        )

        peer.send({
            type: 'price_updates',
            data: updates
        })
    }, 5000)

    return () => clearInterval(interval)
}

function getRandomPrice(coin: string): number {
    const { base } = COINS[coin]
    const variation = (Math.random() - 0.5) * 0.01 // ±0.5% variation
    const price = base * (1 + variation)
    
    // Для мелких монет используем больше десятичных знаков
    return +price.toFixed(base < 0.01 ? 8 : 2)
}
