import { defineNuxtPlugin } from 'nuxt/app'

// Глобальная переменная для хранения экземпляра WebSocket
let wsInstance: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export default defineNuxtPlugin(() => {
    const connectWebSocket = () => {
        if (wsInstance && wsInstance.readyState !== WebSocket.CLOSED) {
            return wsInstance;
        }

        try {
            wsInstance = new WebSocket('ws://localhost:3001/ws');
            
            wsInstance.onopen = () => {
                console.log('WebSocket connected');
                reconnectAttempts = 0;
            };

            wsInstance.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            wsInstance.onclose = () => {
                console.log('WebSocket connection closed');
                wsInstance = null;

                // Attempt to reconnect if not reached max attempts
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                    setTimeout(connectWebSocket, 1000 * reconnectAttempts);
                }
            };

            return wsInstance;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            return null;
        }
    };

    return {
        provide: {
            ws: () => {
                return connectWebSocket();
            }
        }
    }
})
