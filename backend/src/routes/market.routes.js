import express from 'express';
import yahooFinanceService from '../services/YahooFinanceService.js';
import signalGeneratorService from '../services/SignalGeneratorService.js';
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
            symbol: q.symbol,
            name: nameMap[q.symbol] || q.name,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            high: q.high,
            low: q.low,
            open: q.open,
            previousClose: q.previousClose,
            volume: q.volume,
            lastUpdated: q.lastUpdated,
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
        // Fetch quotes for all symbols in batch
        const quotes = await yahooFinanceService.getQuotes(NIFTY_50_SYMBOLS);
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        // Fetch sectors in parallel (only for symbols missing from cache)
        const symbolsMissingCache = NIFTY_50_SYMBOLS.filter(s => !SECTOR_CACHE[s]);
        if (symbolsMissingCache.length > 0) {
            await Promise.all(
                symbolsMissingCache.map(async (symbol) => {
                    try {
                        const profile = await yahooFinanceService.getCompanyProfile(symbol);
                        SECTOR_CACHE[symbol] = profile?.sector || 'Others';
                    } catch {
                        SECTOR_CACHE[symbol] = 'Others';
                    }
                })
            );
        }

        const instruments = NIFTY_50_SYMBOLS.map(symbol => {
            const instrumentKey = getInstrumentKey(symbol);
            if (!instrumentKey) return null;
            const quote = quoteMap.get(symbol) || {};
            return {
                symbol,
                instrumentKey,
                sector: SECTOR_CACHE[symbol] || 'Others',
                price: quote.price || 0,
                change: quote.change || 0,
                changePercent: quote.changePercent || 0,
                volume: quote.volume || 0,
                high: quote.high || 0,
                low: quote.low || 0,
                open: quote.open || 0,
                previousClose: quote.previousClose || 0,
                marketCap: quote.marketCap || 0
            };
        }).filter(Boolean);

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
        const yahooInterval = req.query.interval || '1d';
        const period = req.query.period || '1mo';

        const symbol = getSymbolFromKey(instrumentKey);
        if (!symbol) {
            throw new Error('Invalid instrument key');
        }

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
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const signals = await signalGeneratorService.getSignals(limit);
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
