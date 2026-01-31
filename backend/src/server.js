import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Import configurations
import './config/supabase.config.js';
import { loadNifty50Instruments } from './config/nifty50.config.js';

// Import services
import MarketStreamService from './services/MarketStreamService.js';
import TradingEngine from './services/TradingEngine.js';
import MarketDataService from './services/MarketDataService.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import tradeRoutes from './routes/trade.routes.js';
import marketRoutes from './routes/market.routes.js';
import upstoxRoutes from './routes/upstox.routes.js';
import yahooRoutes from './routes/yahoo.routes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/upstox', upstoxRoutes);
app.use('/api/yahoo', yahooRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join rooms for specific instruments
    socket.on('subscribe', (instrumentKeys) => {
        if (Array.isArray(instrumentKeys)) {
            instrumentKeys.forEach(key => {
                socket.join(`room:${key}`);
            });
            console.log(`📡 Client ${socket.id} subscribed to ${instrumentKeys.length} instruments`);
        }
    });

    // Join 'all' room for all price updates
    socket.on('subscribe_all', () => {
        socket.join('room:all');
        console.log(`📡 Client ${socket.id} subscribed to all instruments`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Initialize services
async function initializeServices() {
    try {
        console.log('🚀 Initializing SimVest Backend...');

        // Load NIFTY 50 instruments
        await loadNifty50Instruments();

        let marketStreamService;
        const useMockData = process.env.USE_MOCK_DATA === 'true';

        if (useMockData) {
            // Use mock service for development
            console.log('💡 Using Mock WebSocket Service (USE_MOCK_DATA=true)');
            const mockMarketDataService = new MarketDataService(io);
            mockMarketDataService.start();
        } else {
            // Use real Upstox service
            console.log('🔗 Connecting to Upstox WebSocket...');
            marketStreamService = new MarketStreamService(io);
            await marketStreamService.connect();
        }

        // Initialize Trading Engine
        const tradingEngine = new TradingEngine(marketStreamService);

        // Make services available to routes
        app.locals.marketStreamService = marketStreamService;
        app.locals.tradingEngine = tradingEngine;

        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
function gracefulShutdown() {
    console.log('\n🛑 Shutting down gracefully...');

    const marketStreamService = app.locals.marketStreamService;
    if (marketStreamService) {
        marketStreamService.disconnect();
    }

    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3000;

initializeServices().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 SimVest Backend running on port ${PORT}`);
        console.log(`📊 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
});
