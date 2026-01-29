import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
    private socket: Socket | null = null;
    private priceCallbacks: Map<string, (data: any) => void> = new Map();

    connect() {
        if (this.socket?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        this.socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 WebSocket disconnected');
        });

        this.socket.on('price_update', (data) => {
            // Call all registered callbacks
            this.priceCallbacks.forEach((callback) => {
                callback(data);
            });
        });

        this.socket.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribeToInstruments(instrumentKeys: string[]) {
        if (!this.socket?.connected) {
            console.warn('WebSocket not connected');
            return;
        }

        this.socket.emit('subscribe', instrumentKeys);
        console.log(`📡 Subscribed to ${instrumentKeys.length} instruments`);
    }

    subscribeToAll() {
        if (!this.socket?.connected) {
            console.warn('WebSocket not connected');
            return;
        }

        this.socket.emit('subscribe_all');
        console.log('📡 Subscribed to all instruments');
    }

    onPriceUpdate(callback: (data: any) => void): () => void {
        const id = Math.random().toString(36);
        this.priceCallbacks.set(id, callback);

        // Return unsubscribe function
        return () => {
            this.priceCallbacks.delete(id);
        };
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const wsService = new WebSocketService();
export default wsService;
