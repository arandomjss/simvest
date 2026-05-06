import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface PriceUpdateData {
    symbol: string;
    instrumentKey: string;
    ltp: number;
    change: number;
    changePercent: number;
    timestamp: number;
}

class WebSocketService {
    private socket: Socket | null = null;
    private priceCallbacks: Map<string, (data: PriceUpdateData) => void> = new Map();
    private pendingSubscribeAll = false;
    private pendingInstruments: string[] = [];

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

            // Process pending subscriptions
            if (this.pendingSubscribeAll) {
                this.socket?.emit('subscribe_all');
                console.log('📡 Subscribed to all instruments (deferred)');
                this.pendingSubscribeAll = false;
            }

            if (this.pendingInstruments.length > 0) {
                this.socket?.emit('subscribe', this.pendingInstruments);
                console.log(`📡 Subscribed to ${this.pendingInstruments.length} instruments (deferred)`);
                this.pendingInstruments = [];
            }
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
            this.pendingSubscribeAll = false;
            this.pendingInstruments = [];
        }
    }

    subscribeToInstruments(instrumentKeys: string[]) {
        if (!this.socket?.connected) {
            console.log('⏳ WebSocket connecting... queueing subscription');
            this.pendingInstruments = [...this.pendingInstruments, ...instrumentKeys];
            return;
        }

        this.socket.emit('subscribe', instrumentKeys);
        console.log(`📡 Subscribed to ${instrumentKeys.length} instruments`);
    }

    subscribeToAll() {
        if (!this.socket?.connected) {
            console.log('⏳ WebSocket connecting... queueing subscribe_all');
            this.pendingSubscribeAll = true;
            return;
        }

        this.socket.emit('subscribe_all');
        console.log('📡 Subscribed to all instruments');
    }

    onPriceUpdate(callback: (data: PriceUpdateData) => void): () => void {
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
