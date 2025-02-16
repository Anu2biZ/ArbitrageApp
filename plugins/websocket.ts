import { defineNuxtPlugin } from 'nuxt/app'


// Глобальная переменная для хранения экземпляра WebSocket
let wsInstance: WebSocket | null = null;

export default defineNuxtPlugin(() => {
    /**
     * Предоставляет функцию ws для доступа к WebSocket соединению
     * 
     * Логика работы:
     * 1. Проверяет существование активного соединения
     * 2. Если соединение отсутствует или закрыто - создает новое
     * 3. Возвращает экземпляр WebSocket для использования
     */
    return {
        provide: {
            ws: () => {
                if (!wsInstance || wsInstance.readyState === WebSocket.CLOSED) {
                    wsInstance = new WebSocket('ws://localhost:3001');
                }
                return wsInstance;
            }
        }
    }
})
