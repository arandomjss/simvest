import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

class YahooFinanceService {
    constructor() {
        // Map Indian stock symbols to Yahoo Finance format (NSE)
        this.symbolMap = {
            'ADANIENT': 'ADANIENT.NS',
            'ADANIPORTS': 'ADANIPORTS.NS',
            'APOLLOHOSP': 'APOLLOHOSP.NS',
            'ASIANPAINT': 'ASIANPAINT.NS',
            'AXISBANK': 'AXISBANK.NS',
            'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
            'BAJAJFINSV': 'BAJAJFINSV.NS',
            'BAJFINANCE': 'BAJFINANCE.NS',
            'BEL': 'BEL.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'CIPLA': 'CIPLA.NS',
            'COALINDIA': 'COALINDIA.NS',
            'DRREDDY': 'DRREDDY.NS',
            'EICHERMOT': 'EICHERMOT.NS',
            'ETERNAL': 'ETERNAL.NS',
            'GRASIM': 'GRASIM.NS',
            'HCLTECH': 'HCLTECH.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'HDFCLIFE': 'HDFCLIFE.NS',
            'HINDALCO': 'HINDALCO.NS',
            'HINDUNILVR': 'HINDUNILVR.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'INDIGO': 'INDIGO.NS',
            'INFY': 'INFY.NS',
            'ITC': 'ITC.NS',
            'JIOFIN': 'JIOFIN.NS',
            'JSWSTEEL': 'JSWSTEEL.NS',
            'KOTAKBANK': 'KOTAKBANK.NS',
            'LT': 'LT.NS',
            'M&M': 'M&M.NS',
            'MARUTI': 'MARUTI.NS',
            'MAXHEALTH': 'MAXHEALTH.NS',
            'NESTLEIND': 'NESTLEIND.NS',
            'NTPC': 'NTPC.NS',
            'ONGC': 'ONGC.NS',
            'POWERGRID': 'POWERGRID.NS',
            'RELIANCE': 'RELIANCE.NS',
            'SBILIFE': 'SBILIFE.NS',
            'SBIN': 'SBIN.NS',
            'SHRIRAMFIN': 'SHRIRAMFIN.NS',
            'SUNPHARMA': 'SUNPHARMA.NS',
            'TATACONSUM': 'TATACONSUM.NS',
            'TATASTEEL': 'TATASTEEL.NS',
            'TCS': 'TCS.NS',
            'TECHM': 'TECHM.NS',
            'TITAN': 'TITAN.NS',
            'TMPV': 'TMPV.NS',
            'TRENT': 'TRENT.NS',
            'ULTRACEMCO': 'ULTRACEMCO.NS',
            'WIPRO': 'WIPRO.NS'
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
        return this.symbolMap[symbol] || (symbol.startsWith('^') || symbol.includes('.') ? symbol : `${symbol}.NS`);
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
                    lastUpdated: Date.now()
                };
            });
        } catch (error) {
            if (!error.message.includes('fetch failed')) {
                console.error('Error fetching quotes:', error.message);
            }
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
     * Get company profile (Sector, Industry, Website)
     */
    async getCompanyProfile(symbol) {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const result = await yahooFinance.quoteSummary(yahooSymbol, { modules: ['summaryProfile'] });

            if (result && result.summaryProfile) {
                return {
                    sector: result.summaryProfile.sector || 'Others',
                    industry: result.summaryProfile.industry || 'Others',
                    website: result.summaryProfile.website,
                    longBusinessSummary: result.summaryProfile.longBusinessSummary
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching profile for ${symbol}:`, error.message);
            return null; // non-critical
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

    /**
     * Get company news
     * yahoo-finance2 v3+ may throw FailedYahooValidationError on the search endpoint
     * because Yahoo changed their API schema. Pass `validateResult: false` to bypass
     * schema validation and receive the raw (but valid) data.
     */
    async getCompanyNews(symbol) {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const result = await yahooFinance.search(
                yahooSymbol,
                { newsCount: 10, quotesCount: 1 },
                { validateResult: false }
            );

            if (result && result.news && Array.isArray(result.news)) {
                return result.news
                    .filter(article => article && article.title && article.link)
                    .map(article => ({
                        id: article.uuid || `${symbol}-${Date.now()}-${Math.random()}`,
                        title: article.title,
                        source: article.publisher || 'Unknown',
                        time: article.providerPublishTime
                            ? new Date(article.providerPublishTime).toISOString()
                            : new Date().toISOString(),
                        link: article.link,
                        sentiment: 'neutral',
                        symbols: article.relatedTickers || [symbol]
                    }));
            }
            return [];
        } catch (error) {
            // Fallback: try to use partial result attached to the error
            if (error.result && error.result.news) {
                return error.result.news
                    .filter(a => a && a.title && a.link)
                    .map(article => ({
                        id: article.uuid || `${symbol}-${Date.now()}`,
                        title: article.title,
                        source: article.publisher || 'Unknown',
                        time: new Date().toISOString(),
                        link: article.link,
                        sentiment: 'neutral',
                        symbols: [symbol]
                    }));
            }
            console.error(`Error fetching news for ${symbol}:`, error.message);
            return [];
        }
    }
}

export default new YahooFinanceService();
