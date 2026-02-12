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

        // Retry logic for network issues
        let retries = 3;
        let lastError;

        while (retries > 0) {
            try {
                const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

                if (error) {
                    if (error.message?.includes('timeout') || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                        retries--;
                        lastError = error;
                        console.log(`Auth timeout, retrying... (${retries} attempts left)`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                        continue;
                    }
                    return res.status(401).json({ error: 'Invalid token' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid token' });
                }

                req.userId = user.id;
                return next();
            } catch (networkError) {
                if (networkError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                    networkError.message?.includes('timeout') ||
                    networkError.message?.includes('fetch failed')) {
                    retries--;
                    lastError = networkError;
                    console.log(`Network error, retrying... (${retries} attempts left):`, networkError.message);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw networkError;
            }
        }

        // If we get here, all retries failed
        console.error('Authentication failed after all retries:', lastError);
        return res.status(503).json({
            error: 'Service temporarily unavailable. Please try again later.',
            details: 'Authentication service connection failed'
        });

    } catch (error) {
        console.error('Authentication error:', error);
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

/**
 * Helper to convert JSON to XML
 */
function jsonToXml(json) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<orders>';

    if (Array.isArray(json)) {
        json.forEach(item => {
            xml += '\n  <order>';
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    xml += `\n    <${key}>${item[key]}</${key}>`;
                }
            }
            xml += '\n  </order>';
        });
    }

    xml += '\n</orders>';
    return xml;
}

/**
 * GET /api/orders/history/xml
 * Export user's order history as XML
 */
router.get('/orders/history/xml', authenticateUser, async (req, res) => {
    try {
        const tradingEngine = req.app.locals.tradingEngine;
        // Fetch all orders for export (or apply a reasonable limit if needed)
        // For export, we might want all of them, but let's stick to a generous limit for now or all if the engine supports it.
        // tradingEngine.getOrderHistory(userId, limit, offset)
        // Let's assume we want the latest 1000 for the export for now to avoid overloading.
        const orders = await tradingEngine.getOrderHistory(req.userId, 1000, 0);

        const xmlData = jsonToXml(orders);

        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename="trade_history.xml"');
        res.send(xmlData);
    } catch (error) {
        console.error('Order history XML export error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/trade/orders/:orderId
 * Cancel a pending order
 */
router.delete('/orders/:orderId', authenticateUser, async (req, res) => {
    try {
        const { orderId } = req.params;
        const tradingEngine = req.app.locals.tradingEngine;

        const result = await tradingEngine.cancelOrder(req.userId, orderId);
        res.json(result);
    } catch (error) {
        console.error('Order cancellation error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
