// server/websocket/scanner.ts
let connections = new Set()

export default defineWebSocketHandler({
    open(peer) {
        connections.add(peer)
        startPriceUpdates(peer)
    },
    close(peer) {
        connections.delete(peer)
    }
})

function startPriceUpdates(peer) {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    const exchanges = ['Binance', 'Bybit', 'KuCoin']

    const interval = setInterval(() => {
        const updates = pairs.flatMap(pair =>
            exchanges.map(exchange => ({
                pair,
                exchange,
                price: getRandomPrice(pair),
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

function getRandomPrice(pair) {
    const basePrice = {
        'BTC/USDT': 45000,
        'ETH/USDT': 2500,
        'SOL/USDT': 100
    }[pair]

    return +(basePrice + (Math.random() - 0.5) * basePrice * 0.01).toFixed(2)
}
