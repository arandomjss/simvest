import express from 'express';
import { supabaseAnon } from '../config/supabase.config.js';

const router = express.Router();

/**
 * Middleware to verify Supabase JWT token
 */
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);

        if (process.env.USE_MOCK_DATA === 'true' && token === 'mock-token-dev') {
            console.log('⚠️  Authenticating with MOCK TOKEN');
            req.userId = '11111111-1111-1111-1111-111111111111';
            return next();
        }

        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.userId = user.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * POST /api/trade/execute
 * Execute a virtual trade
 */
router.post('/execute', authenticateUser, async (req, res) => {
    try {
        const { symbol, instrumentKey, type, quantity, orderType, limitPrice } = req.body;

        // Validate inputs
        if (!symbol || !instrumentKey || !type || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get trading engine from app locals
        const tradingEngine = req.app.locals.tradingEngine;

        const result = await tradingEngine.executeTrade(req.userId, {
            symbol,
            instrumentKey,
            type,
            quantity,
            orderType,
            limitPrice
        });

        res.json(result);
    } catch (error) {
        console.error('Trade execution error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio
 * Get user's portfolio with real-time P&L
 */
router.get('/portfolio', authenticateUser, async (req, res) => {
    try {
        const tradingEngine = req.app.locals.tradingEngine;
        const portfolio = await tradingEngine.getPortfolio(req.userId);

        res.json({ portfolio });
    } catch (error) {
        console.error('Portfolio fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/orders/history
 * Get user's order history
 */
router.get('/orders/history', authenticateUser, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const tradingEngine = req.app.locals.tradingEngine;
        const orders = await tradingEngine.getOrderHistory(req.userId, limit, offset);

        res.json({ orders });
    } catch (error) {
        console.error('Order history fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
