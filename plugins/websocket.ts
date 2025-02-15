export default defineNuxtPlugin(() => {
    return {
        provide: {
            ws: () => new WebSocket('ws://localhost:3001')
        }
    }
})
