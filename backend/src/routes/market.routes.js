import express from 'express';
import yahooFinanceService from '../services/YahooFinanceService.js';
import { getSymbolFromKey, getInstrumentKey, NIFTY_50_SYMBOLS } from '../config/nifty50.config.js';
import { supabase } from '../config/supabase.config.js';

const router = express.Router();

/**
 * GET /api/market/instruments
 * Get NIFTY 50 instrument list
 */
const SECTOR_CACHE = {};

/**
 * GET /api/market/indices
 * Get major market indices (Nifty 50, Sensex, Bank Nifty)
 */
router.get('/indices', async (req, res) => {
    try {
        const symbols = ['^NSEI', '^BSESN', '^NSEBANK'];
        const quotes = await yahooFinanceService.getQuotes(symbols);

        // Map to friendly names
        const nameMap = {
            '^NSEI': 'NIFTY 50',
            '^BSESN': 'SENSEX',
            '^NSEBANK': 'BANK NIFTY'
        };

        const indices = quotes.map(q => ({
            ...q,
            name: nameMap[q.symbol] || q.name
        }));

        res.json({ indices });
    } catch (error) {
        console.error('Indices fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/market/instruments
 * Get NIFTY 50 instrument list with Sectors
 */
router.get('/instruments', async (req, res) => {
    try {
        // Fetch quotes for all symbols in batch to ensure we have initial data (High, Low, Open, etc.)
        const quotes = await yahooFinanceService.getQuotes(NIFTY_50_SYMBOLS);
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        const instruments = [];

        // Parallel sector fetching if needed (though batch profile would be better if Yahoo supported it, but it doesn't easily)
        // We'll stick to sequential or Promise.all for sectors if cache missing, but we can reuse the existing structure partially.

        // Let's just Loop and build.
        for (const symbol of NIFTY_50_SYMBOLS) {
            const instrumentKey = getInstrumentKey(symbol);
            if (!instrumentKey) continue;

            if (!SECTOR_CACHE[symbol]) {
                try {
                    // Start async fetch but don't block everything? 
                    // No, for first load valid data is better.
                    const profile = await yahooFinanceService.getCompanyProfile(symbol);
                    SECTOR_CACHE[symbol] = profile?.sector || 'Others';
                } catch (e) {
                    SECTOR_CACHE[symbol] = 'Others';
                }
            }

            const quote = quoteMap.get(symbol) || {};

            instruments.push({
                symbol,
                instrumentKey,
                sector: SECTOR_CACHE[symbol],
                price: quote.price || 0,
                change: quote.change || 0,
                changePercent: quote.changePercent || 0,
                volume: quote.volume || 0,
                high: quote.high || 0,
                low: quote.low || 0,
                open: quote.open || 0,
                previousClose: quote.previousClose || 0,
                marketCap: quote.marketCap || 0
            });
        }

        res.json({ instruments });
    } catch (error) {
        console.error('Instruments fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/market/historical/:instrumentKey
 * Fetch historical candle data from Yahoo Finance
 */
router.get('/historical/:instrumentKey', async (req, res) => {
    try {
        const { instrumentKey } = req.params;
        const interval = req.query.interval || '1d';

        // Convert instrument key to symbol
        const symbol = getSymbolFromKey(instrumentKey);
        if (!symbol) {
            throw new Error('Invalid instrument key');
        }

        // Map interval to Yahoo Finance format
        // Yahoo supports: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        // We accept params from frontend or default to reasonable values
        const yahooInterval = req.query.interval || '1d';
        const period = req.query.period || '1mo';

        const candles = await yahooFinanceService.getHistoricalData(symbol, period, yahooInterval);

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

/**
 * GET /api/market/news
 * Get live market news from Google RSS (Fetched via Backend to avoid CORS)
 */
router.get('/news', async (req, res) => {
    try {
        const RSS_URL = 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en';

        // Native fetch (Node 18+)
        const response = await fetch(RSS_URL);
        if (!response.ok) throw new Error(`RSS Fetch failed: ${response.status}`);

        const xmlText = await response.text();

        // Simple Regex Parser for RSS Items
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];

            const titleMatch = /<title>(.*?)<\/title>/.exec(itemContent);
            const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
            const dateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
            const sourceMatch = /<source url=".*?">(.*?)<\/source>/.exec(itemContent);

            if (titleMatch && linkMatch) {
                const pubDate = dateMatch ? new Date(dateMatch[1]) : new Date();
                items.push({
                    title: titleMatch[1],
                    url: linkMatch[1],
                    time: pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    // Store full date for sorting if needed, or just sort logic
                    timestamp: pubDate.getTime(),
                    source: sourceMatch ? sourceMatch[1] : 'Google News',
                    category: 'Business'
                });
            }
        }

        // Sort by Newest First
        items.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ news: items.slice(0, 15) });

    } catch (error) {
        console.error('News fetch error:', error);
        // Fallback to empty array, let frontend handle or show error
        res.status(500).json({ error: "Failed to fetch live news" });
    }
});

export default router;
