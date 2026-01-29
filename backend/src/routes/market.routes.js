import express from 'express';
import { getAllInstrumentKeys, getInstrumentKey, NIFTY_50_SYMBOLS } from '../config/nifty50.config.js';
import { getHistoricalData } from '../config/upstox.config.js';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

/**
 * GET /api/market/instruments
 * Get NIFTY 50 instrument list
 */
router.get('/instruments', (req, res) => {
    try {
        const instruments = NIFTY_50_SYMBOLS.map(symbol => ({
            symbol,
            instrumentKey: getInstrumentKey(symbol)
        })).filter(item => item.instrumentKey); // Filter out any missing keys

        res.json({ instruments });
    } catch (error) {
        console.error('Instruments fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/market/historical/:instrumentKey
 * Fetch historical candle data
 */
router.get('/historical/:instrumentKey', async (req, res) => {
    try {
        const { instrumentKey } = req.params;
        const interval = req.query.interval || '1minute';

        const candles = await getHistoricalData(instrumentKey, interval);

        res.json({ candles });
    } catch (error) {
        console.error('Historical data fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/market/signals
 * Get latest market signals from Python worker
 */
router.get('/signals', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const { data: signals, error } = await supabase
            .from('market_signals')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({ signals });
    } catch (error) {
        console.error('Signals fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
