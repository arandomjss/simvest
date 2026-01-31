import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { getAllInstrumentKeys, getSymbolFromKey } from '../config/nifty50.config.js';
import yahooFinanceService from './YahooFinanceService.js';

/**
 * Market Data Service
 * Provides real-time market data from Yahoo Finance (and simulates ticks)
 */
class MarketDataService extends EventEmitter {
    constructor(io) {
        super();
        this.io = io; // Socket.io instance for broadcasting
        this.wsServer = null;
        this.updateInterval = null;
        this.mockPrices = new Map();
        this.previousCloses = new Map(); // Store previous close for day change calculation
        this.isRunning = false;
        this.lastFetchTime = 0;
        this.fetchInterval = 5000; // Fetch from Yahoo every 5 seconds
    }



    /**
     * Get realistic base price for a symbol (fallback)
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

        return priceRanges[symbol] || (Math.random() * 2000 + 500);
    }

    /**
     * Fetch fresh prices from Yahoo Finance
     */
    async fetchRealPrices() {
        const now = Date.now();

        // Only fetch if enough time has passed
        if (now - this.lastFetchTime < this.fetchInterval) {
            return;
        }

        this.lastFetchTime = now;
        const instrumentKeys = getAllInstrumentKeys();
        const symbols = instrumentKeys.map(key => getSymbolFromKey(key));

        try {
            const quotes = await yahooFinanceService.getQuotes(symbols);

            quotes.forEach((quote, index) => {
                const instrumentKey = instrumentKeys[index];
                this.mockPrices.set(instrumentKey, quote.price);
                // Always update previous close with real data from Yahoo
                if (quote.previousClose) {
                    this.previousCloses.set(instrumentKey, quote.previousClose);
                } else if (!this.previousCloses.has(instrumentKey)) {
                    // Fallback only if we really don't have one
                    this.previousCloses.set(instrumentKey, quote.price);
                }
                // Store the real timestamp from Yahoo
                this.mockPrices.set(`${instrumentKey}_time`, quote.lastUpdated);
            });

            console.log('🔄 Updated prices from Yahoo Finance');
        } catch (error) {
            console.error('⚠️  Error fetching Yahoo prices:', error.message);
            // Keep using cached prices
        }
    }

    /**
     * Generate realistic price movement (small fluctuations between Yahoo updates)
     */
    /**
     * Get current price for instrument (no simulation)
     */
    generatePriceUpdate(instrumentKey) {
        // Return exact price from Yahoo Finance without simulation
        return this.mockPrices.get(instrumentKey) || 0;
    }

    /**
     * Start mock data generation
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Mock service already running');
            return;
        }

        console.log('🚀 Starting Live Market Data Service (Yahoo Finance)...');

        // Initialize with base prices IMMEDIATELY to prevent empty cache race conditions
        const instrumentKeys = getAllInstrumentKeys();
        instrumentKeys.forEach(instrumentKey => {
            const symbol = getSymbolFromKey(instrumentKey);
            const basePrice = this.getBasePriceForSymbol(symbol);
            this.mockPrices.set(instrumentKey, basePrice);
            this.previousCloses.set(instrumentKey, basePrice); // Initialize prev close too
        });
        console.log(`✅ Pre-initialized ${this.mockPrices.size} instruments with base prices`);

        // Now update with real data asynchronously
        this.fetchRealPrices().catch(err => console.error("Initial fetch failed:", err.message));

        this.isRunning = true;

        // Broadcast price updates when data is fetched (or slightly more often if needed)
        // Since we removed simulation, we can sync this with fetch, or keep it 1s to ensure UI stays responsive
        // but sends same price until new fetch.
        // Let's keep 1s broadcast but only fetch every 5s.
        // Fetch and broadcast every 5 seconds
        // (Yahoo Finance free tier usually updates delayed or on 1-5m interval, but we poll every 5s for best latency)
        this.updateInterval = setInterval(async () => {
            await this.fetchRealPrices();
            this.broadcastPriceUpdates();
        }, 5000);

        console.log('✅ Live Market Data Service started');
        console.log('📡 Broadcasting real-time price updates');
    }

    /**
     * Broadcast price updates to all connected clients
     */
    broadcastPriceUpdates() {
        // Broadcast updates for ALL supported instruments
        const instrumentKeys = getAllInstrumentKeys();

        instrumentKeys.forEach(instrumentKey => {
            const symbol = getSymbolFromKey(instrumentKey);
            // Get latest price (exact match from Yahoo)
            const ltp = this.generatePriceUpdate(instrumentKey);
            const timestamp = this.mockPrices.get(`${instrumentKey}_time`) || Date.now();

            const prevClose = this.previousCloses.get(instrumentKey) || ltp;
            const change = ltp - prevClose;
            const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

            const priceUpdate = {
                symbol,
                instrumentKey,
                ltp,
                ltp,
                change,
                changePercent,
                timestamp: timestamp
            };

            // Broadcast to Socket.io rooms (same as real service)
            this.io.to(`room:${instrumentKey}`).emit('price_update', priceUpdate);
            this.io.to('room:all').emit('price_update', priceUpdate);

            // Emit internal event for matching engine
            this.emit('priceUpdate', {
                instrumentKey,
                ltp
            });
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

export default MarketDataService;
