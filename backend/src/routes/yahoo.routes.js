import express from 'express';
import yahooFinanceService from '../services/YahooFinanceService.js';

const router = express.Router();

/**
 * Get single quote
 */
router.get('/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const quote = await yahooFinanceService.getQuote(symbol);

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get multiple quotes (batch)
 */
router.post('/quotes', async (req, res) => {
    try {
        const { symbols } = req.body;

        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({
                success: false,
                message: 'Symbols array is required'
            });
        }

        const quotes = await yahooFinanceService.getQuotes(symbols);

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
router.get('/historical/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1mo', interval = '1d' } = req.query;

        const data = await yahooFinanceService.getHistoricalData(symbol, period, interval);

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
 * Search stocks
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "q" is required'
            });
        }

        const results = await yahooFinanceService.searchSymbol(q);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get company profile (Sector, Industry, Summary)
 */
router.get('/profile/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const profile = await yahooFinanceService.getCompanyProfile(symbol);

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
 * Get company news
 */
router.get('/news/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const news = await yahooFinanceService.getCompanyNews(symbol);

        res.json({
            success: true,
            data: news
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
