import WebSocket from 'ws';
import { getAllInstrumentKeys, getSymbolFromKey } from '../config/nifty50.config.js';

/**
 * Mock WebSocket Service
 * Simulates Upstox market data feed for development without API credentials
 */
class MockWebSocketService {
    constructor(io) {
        this.io = io; // Socket.io instance for broadcasting
        this.wsServer = null;
        this.updateInterval = null;
        this.mockPrices = new Map();
        this.isRunning = false;
    }

    /**
     * Initialize mock prices for all instruments
     */
    initializeMockPrices() {
        const instrumentKeys = getAllInstrumentKeys();

        instrumentKeys.forEach(key => {
            const symbol = getSymbolFromKey(key);
            // Set realistic base prices for NIFTY 50 stocks
            const basePrice = this.getBasePriceForSymbol(symbol);
            this.mockPrices.set(key, basePrice);
        });

        console.log(`📊 Initialized mock prices for ${this.mockPrices.size} instruments`);
    }

    /**
     * Get realistic base price for a symbol
     */
    getBasePriceForSymbol(symbol) {
        // Realistic price ranges for major NIFTY 50 stocks
        const priceRanges = {
            'RELIANCE': 2500,
            'TCS': 3500,
            'HDFCBANK': 1600,
            'INFY': 1400,
            'ICICIBANK': 950,
            'HINDUNILVR': 2400,
            'ITC': 420,
            'SBIN': 580,
            'BHARTIARTL': 850,
            'KOTAKBANK': 1750,
            'LT': 3200,
            'AXISBANK': 1050,
            'ASIANPAINT': 2900,
            'MARUTI': 10500,
            'SUNPHARMA': 1450,
            'TITAN': 3100,
            'ULTRACEMCO': 8500,
            'BAJFINANCE': 6500,
            'NESTLEIND': 2200,
            'WIPRO': 450
        };

        return priceRanges[symbol] || (Math.random() * 2000 + 500); // Default random price
    }

    /**
     * Generate realistic price movement
     */
    generatePriceUpdate(instrumentKey) {
        const currentPrice = this.mockPrices.get(instrumentKey);

        // Random price change: ±0.5% with 70% probability, ±1.5% with 30% probability
        const volatility = Math.random() < 0.7 ? 0.005 : 0.015;
        const direction = Math.random() < 0.5 ? 1 : -1;
        const change = currentPrice * volatility * direction;

        const newPrice = parseFloat((currentPrice + change).toFixed(2));
        this.mockPrices.set(instrumentKey, newPrice);

        return newPrice;
    }

    /**
     * Start mock data generation
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Mock service already running');
            return;
        }

        console.log('🚀 Starting Mock WebSocket Service...');
        this.initializeMockPrices();
        this.isRunning = true;

        // Broadcast price updates every 1 second
        this.updateInterval = setInterval(() => {
            this.broadcastPriceUpdates();
        }, 1000);

        console.log('✅ Mock WebSocket Service started');
        console.log('📡 Broadcasting mock price updates every 1 second');
    }

    /**
     * Broadcast price updates to all connected clients
     */
    broadcastPriceUpdates() {
        const instrumentKeys = getAllInstrumentKeys();

        // Update 10-20 random stocks per tick (simulate realistic market activity)
        const numUpdates = Math.floor(Math.random() * 10) + 10;
        const shuffled = [...instrumentKeys].sort(() => Math.random() - 0.5);
        const toUpdate = shuffled.slice(0, numUpdates);

        toUpdate.forEach(instrumentKey => {
            const symbol = getSymbolFromKey(instrumentKey);
            const ltp = this.generatePriceUpdate(instrumentKey);

            const priceUpdate = {
                symbol,
                instrumentKey,
                ltp,
                timestamp: Date.now()
            };

            // Broadcast to Socket.io rooms (same as real service)
            this.io.to(`room:${instrumentKey}`).emit('price_update', priceUpdate);
            this.io.to('room:all').emit('price_update', priceUpdate);
        });
    }

    /**
     * Get current mock price for an instrument
     */
    getCachedPrice(instrumentKey) {
        return this.mockPrices.get(instrumentKey);
    }

    /**
     * Stop mock service
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Mock WebSocket Service stopped');
    }

    /**
     * Disconnect (for compatibility with real service)
     */
    disconnect() {
        this.stop();
    }
}

export default MockWebSocketService;
