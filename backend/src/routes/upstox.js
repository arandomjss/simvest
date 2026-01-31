const express = require('express');
const router = express.Router();
const upstoxService = require('../services/UpstoxService');

// Store access tokens (in production, use a database)
const userTokens = new Map();

/**
 * Get Upstox login URL
 */
router.get('/login-url', (req, res) => {
    try {
        const state = Math.random().toString(36).substring(7);
        const loginUrl = upstoxService.getLoginUrl(state);

        res.json({
            success: true,
            loginUrl,
            state
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Handle OAuth callback and exchange code for token
 */
router.post('/callback', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        const tokenData = await upstoxService.getAccessToken(code);

        // Store token (in production, associate with user ID)
        const userId = req.user?.id || 'default_user';
        userTokens.set(userId, tokenData.access_token);

        res.json({
            success: true,
            accessToken: tokenData.access_token,
            message: 'Successfully connected to Upstox'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get user profile
 */
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const profile = await upstoxService.getUserProfile(accessToken);

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get market quotes
 */
router.post('/quotes', async (req, res) => {
    try {
        const { instrumentKeys } = req.body;
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const quotes = await upstoxService.getQuotes(instrumentKeys, accessToken);

        res.json({
            success: true,
            data: quotes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get historical data
 */
router.get('/historical/:instrumentKey/:interval/:toDate', async (req, res) => {
    try {
        const { instrumentKey, interval, toDate } = req.params;
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const data = await upstoxService.getHistoricalData(
            instrumentKey,
            interval,
            toDate,
            accessToken
        );

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get holdings
 */
router.get('/holdings', async (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const holdings = await upstoxService.getHoldings(accessToken);

        res.json({
            success: true,
            data: holdings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get positions
 */
router.get('/positions', async (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const positions = await upstoxService.getPositions(accessToken);

        res.json({
            success: true,
            data: positions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Place order
 */
router.post('/order/place', async (req, res) => {
    try {
        const orderData = req.body;
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const result = await upstoxService.placeOrder(orderData, accessToken);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get all orders
 */
router.get('/orders', async (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const accessToken = userTokens.get(userId);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Upstox'
            });
        }

        const orders = await upstoxService.getOrders(accessToken);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Disconnect from Upstox
 */
router.post('/disconnect', (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        userTokens.delete(userId);

        res.json({
            success: true,
            message: 'Disconnected from Upstox'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Check connection status
 */
router.get('/status', (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const isConnected = userTokens.has(userId);

        res.json({
            success: true,
            isConnected
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
