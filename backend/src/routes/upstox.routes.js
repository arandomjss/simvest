import express from 'express';
import upstoxService from '../services/UpstoxService.js';

const router = express.Router();

/**
 * Get Upstox login URL (admin only)
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
 * Handle OAuth callback and exchange code for token (admin only)
 */
router.post('/callback', async (req, res) => {
    try {
        console.log('📥 Upstox Callback received');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        const { code } = req.body;

        if (!code) {
            console.error('❌ No authorization code provided');
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        console.log('🔄 Exchanging authorization code for access token...');
        const tokenData = await upstoxService.getAccessToken(code);
        console.log('✅ Token exchange successful');

        // Store as admin token (shared for all users)
        upstoxService.setAdminToken(tokenData.access_token);

        res.json({
            success: true,
            message: 'Admin successfully connected to Upstox! All users can now access live market data.'
        });
    } catch (error) {
        console.error('❌ Callback error:', error.message);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Get market quotes (uses shared admin token)
 */
router.post('/quotes', async (req, res) => {
    try {
        const { instrumentKeys } = req.body;

        if (!upstoxService.isAdminConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Admin not connected to Upstox. Please connect first.'
            });
        }

        const quotes = await upstoxService.getQuotes(instrumentKeys);

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
 * Get historical data (uses shared admin token)
 */
router.get('/historical/:instrumentKey/:interval/:toDate', async (req, res) => {
    try {
        const { instrumentKey, interval, toDate } = req.params;

        if (!upstoxService.isAdminConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Admin not connected to Upstox'
            });
        }

        const data = await upstoxService.getHistoricalData(
            instrumentKey,
            interval,
            toDate
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
 * Disconnect from Upstox (admin only)
 */
router.post('/disconnect', (req, res) => {
    try {
        upstoxService.setAdminToken(null);

        res.json({
            success: true,
            message: 'Admin disconnected from Upstox'
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
        const isConnected = upstoxService.isAdminConnected();

        res.json({
            success: true,
            isConnected,
            message: isConnected ? 'Admin connected - live data available' : 'Admin not connected - using mock data'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
