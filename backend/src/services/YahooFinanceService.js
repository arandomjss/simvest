import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

console.log('DEBUG: yahooFinance instance created successfully');

class YahooFinanceService {
    constructor() {
        // Map Indian stock symbols to Yahoo Finance format (NSE)
        this.symbolMap = {
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'INFY': 'INFY.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'HINDUNILVR': 'HINDUNILVR.NS',
            'ITC': 'ITC.NS',
            'SBIN': 'SBIN.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'KOTAKBANK': 'KOTAKBANK.NS',
            'LT': 'LT.NS',
            'AXISBANK': 'AXISBANK.NS',
            'ASIANPAINT': 'ASIANPAINT.NS',
            'MARUTI': 'MARUTI.NS',
            'SUNPHARMA': 'SUNPHARMA.NS',
            'TITAN': 'TITAN.NS',
            'BAJFINANCE': 'BAJFINANCE.NS',
            'ULTRACEMCO': 'ULTRACEMCO.NS',
            'NESTLEIND': 'NESTLEIND.NS',
            'WIPRO': 'WIPRO.NS',
            'HCLTECH': 'HCLTECH.NS',
            'TECHM': 'TECHM.NS',
            'POWERGRID': 'POWERGRID.NS',
            'NTPC': 'NTPC.NS',
            'ONGC': 'ONGC.NS',
            'TATAMOTORS': 'TATAMOTORS.NS',
            'TATASTEEL': 'TATASTEEL.NS',
            'ADANIPORTS': 'ADANIPORTS.NS',
            'COALINDIA': 'COALINDIA.NS',
            'BAJAJFINSV': 'BAJAJFINSV.NS',
            'M&M': 'M&M.NS',
            'DRREDDY': 'DRREDDY.NS',
            'DIVISLAB': 'DIVISLAB.NS',
            'EICHERMOT': 'EICHERMOT.NS',
            'GRASIM': 'GRASIM.NS',
            'HEROMOTOCO': 'HEROMOTOCO.NS',
            'HINDALCO': 'HINDALCO.NS',
            'INDUSINDBK': 'INDUSINDBK.NS',
            'JSWSTEEL': 'JSWSTEEL.NS',
            'BRITANNIA': 'BRITANNIA.NS',
            'CIPLA': 'CIPLA.NS',
            'APOLLOHOSP': 'APOLLOHOSP.NS',
            'TATACONSUM': 'TATACONSUM.NS',
            'BPCL': 'BPCL.NS',
            'SHREECEM': 'SHREECEM.NS',
            'UPL': 'UPL.NS',
            'ADANIENT': 'ADANIENT.NS',
            'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
            'SBILIFE': 'SBILIFE.NS',
        };

        // Suppress generic warnings from the library
        // Check if suppressNotices exists on instance
        if (yahooFinance.suppressNotices) {
            yahooFinance.suppressNotices(['yahooSurvey']);
        }
    }

    /**
     * Convert symbol to Yahoo Finance format
     */
    toYahooSymbol(symbol) {
        return this.symbolMap[symbol] || (symbol.includes('.') ? symbol : `${symbol}.NS`);
    }

    /**
     * Convert Yahoo symbol back to simple format
     */
    fromYahooSymbol(yahooSymbol) {
        return yahooSymbol.replace('.NS', '').replace('.BO', '');
    }

    /**
     * Get single quote
     */
    async getQuote(symbol) {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const quote = await yahooFinance.quote(yahooSymbol);

            if (!quote) {
                throw new Error(`Symbol ${symbol} not found`);
            }

            return this.formatQuote(quote, symbol);
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Get multiple quotes (batch)
     */
    async getQuotes(symbols) {
        try {
            const yahooSymbols = symbols.map(s => this.toYahooSymbol(s));
            // yahoo-finance2 supports array for batch fetch
            const quotes = await yahooFinance.quote(yahooSymbols);

            // Map results back to original order? 
            // The library returns array, order might match provided symbols or might not if some fail?
            // Actually it usually returns found quotes. Let's map by symbol.

            const quoteMap = new Map();
            quotes.forEach(q => {
                const simpleSymbol = this.fromYahooSymbol(q.symbol);
                // Also handle case where q.symbol matches what we sent (e.g. RELIANCE.NS)
                quoteMap.set(q.symbol, q);
            });

            return symbols.map(originalSymbol => {
                const ySym = this.toYahooSymbol(originalSymbol);
                const q = quoteMap.get(ySym);
                if (q) {
                    return this.formatQuote(q, originalSymbol);
                }
                // Return fallback or null if not found
                return {
                    symbol: originalSymbol,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    changePercent: 0,
                    lastUpdated: Date.now()
                };
            });
        } catch (error) {
            console.error('Error fetching quotes:', error.message);
            throw error;
        }
    }

    /**
     * Format quote data to match our app structure
     */
    formatQuote(yahooData, originalSymbol) {
        return {
            symbol: originalSymbol,
            name: yahooData.longName || yahooData.shortName || originalSymbol,
            price: yahooData.regularMarketPrice || 0,
            change: yahooData.regularMarketChange || 0,
            changePercent: yahooData.regularMarketChangePercent || 0,
            volume: yahooData.regularMarketVolume || 0,
            high: yahooData.regularMarketDayHigh || 0,
            low: yahooData.regularMarketDayLow || 0,
            open: yahooData.regularMarketOpen || 0,
            previousClose: yahooData.regularMarketPreviousClose || 0,
            marketCap: yahooData.marketCap || 0,
            lastUpdated: yahooData.regularMarketTime ? new Date(yahooData.regularMarketTime).getTime() : Date.now(),
        };
    }

    /**
     * Get historical data for charts
     */
    async getHistoricalData(symbol, period = '1mo', interval = '1d') {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);

            // Calculate timestamps
            // yahoo-finance2 chart uses period1 (start) and period2 (end)
            const periods = {
                '1d': 1,
                '5d': 5,
                '1mo': 30,
                '3mo': 90,
                '6mo': 180,
                '1y': 365,
                '5y': 1825,
            };

            const days = periods[period] || 30;
            const period2 = new Date(); // now
            const period1 = new Date(period2.getTime() - (days * 24 * 60 * 60 * 1000));

            const queryOptions = {
                period1: period1, // Date object or string or number
                period2: period2,
                interval: interval // '1d', '1wk', '1mo'
            };

            const result = await yahooFinance.chart(yahooSymbol, queryOptions);

            if (!result || !result.quotes) {
                return [];
            }

            // Format as OHLCV data
            return result.quotes.map(candle => ({
                timestamp: candle.date.getTime(),
                date: candle.date.toISOString(),
                open: candle.open || 0,
                high: candle.high || 0,
                low: candle.low || 0,
                close: candle.close || 0,
                volume: candle.volume || 0,
            }));

        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Search for stocks
     */
    async searchSymbol(query) {
        try {
            const result = await yahooFinance.search(query);

            if (!result || !result.quotes) {
                return [];
            }

            return result.quotes
                .filter(q => q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO'))
                .map(q => ({
                    symbol: this.fromYahooSymbol(q.symbol),
                    name: q.longname || q.shortname,
                    exchange: q.exchange,
                    type: q.quoteType,
                }));
        } catch (error) {
            console.error('Error searching symbols:', error.message);
            return [];
        }
    }
}

export default new YahooFinanceService();
