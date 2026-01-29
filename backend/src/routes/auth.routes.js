import express from 'express';
import { getAuthorizationUrl, exchangeCodeForToken } from '../config/upstox.config.js';

const router = express.Router();

/**
 * GET /auth/upstox
 * Redirect to Upstox authorization page
 */
router.get('/upstox', (req, res) => {
    try {
        const authUrl = getAuthorizationUrl();
        res.redirect(authUrl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /auth/callback
 * Handle OAuth callback from Upstox
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code not provided' });
        }

        // Exchange code for access token
        const accessToken = await exchangeCodeForToken(code);

        // Redirect to frontend with success message
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
    }
});

export default router;
