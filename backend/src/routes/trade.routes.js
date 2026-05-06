import express from 'express';

const router = express.Router();

import authenticateUser from '../middleware/auth.middleware.js';

/**
 * POST /api/trade/execute
 * Execute a virtual trade
 */
router.post('/execute', authenticateUser, async (req, res) => {
    try {
        const { symbol, instrumentKey, type, quantity, orderType, limitPrice, strategy, notes } = req.body;

        // Validate inputs
        if (!symbol || !instrumentKey || !type || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be a positive integer' });
        }

        if (orderType === 'LIMIT' && (typeof limitPrice !== 'number' || limitPrice <= 0)) {
            return res.status(400).json({ error: 'Valid limit price is required for LIMIT orders' });
        }

        // Get trading engine from app locals
        const tradingEngine = req.app.locals.tradingEngine;

        const result = await tradingEngine.executeTrade(req.userId, {
            symbol,
            instrumentKey,
            type,
            quantity,
            orderType,
            limitPrice,
            strategy,
            notes
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
        const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);  // Prevent negative offset

        const tradingEngine = req.app.locals.tradingEngine;
        const orders = await tradingEngine.getOrderHistory(req.userId, limit, offset);

        res.json({ orders });
    } catch (error) {
        console.error('Order history fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Escape special XML characters to prevent injection
 */
function escapeXml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

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
                    xml += `\n    <${key}>${escapeXml(item[key])}</${key}>`;
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
