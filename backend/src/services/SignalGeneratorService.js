import { RSI, MACD, BollingerBands, EMA } from 'technicalindicators';
import YahooFinanceService from './YahooFinanceService.js';
import { NIFTY_50_SYMBOLS } from '../config/nifty50.config.js';
import { randomUUID } from 'crypto';

// Scan top 25 liquid NIFTY stocks for signals (full 50 would be too slow)
const SCAN_SYMBOLS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
    'SBIN', 'BHARTIARTL', 'HINDUNILVR', 'ITC', 'KOTAKBANK',
    'WIPRO', 'AXISBANK', 'BAJFINANCE', 'HCLTECH', 'ASIANPAINT',
    'TITAN', 'MARUTI', 'SUNPHARMA', 'NTPC', 'POWERGRID',
    'ONGC', 'COALINDIA', 'JSWSTEEL', 'TATASTEEL', 'LT',
];

// Cache signals for 30 minutes to avoid hammering Yahoo Finance
const CACHE_TTL_MS = 30 * 60 * 1000;
let signalCache = { signals: [], generatedAt: 0 };

class SignalGeneratorService {
    /**
     * Get signals — served from cache if fresh, else re-generated
     */
    async getSignals(limit = 20) {
        const now = Date.now();
        if (signalCache.signals.length > 0 && (now - signalCache.generatedAt) < CACHE_TTL_MS) {
            console.log('📊 Serving signals from cache');
            return signalCache.signals.slice(0, limit);
        }

        console.log('🔍 Generating fresh market signals...');
        const signals = await this._generateSignals();
        signalCache = { signals, generatedAt: Date.now() };
        return signals.slice(0, limit);
    }

    /**
     * Core signal generation engine
     */
    async _generateSignals() {
        const allSignals = [];
        const now = new Date().toISOString();

        // Process symbols in parallel batches of 5 to balance speed vs rate limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < SCAN_SYMBOLS.length; i += BATCH_SIZE) {
            const batch = SCAN_SYMBOLS.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.allSettled(
                batch.map(symbol => this._analyzeSymbol(symbol, now))
            );

            for (const result of batchResults) {
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    allSignals.push(...result.value);
                }
            }
        }

        // Sort: strongest signals first
        const strengthOrder = { STRONG: 0, MODERATE: 1, WEAK: 2 };
        allSignals.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);

        console.log(`✅ Generated ${allSignals.length} signals for ${SCAN_SYMBOLS.length} symbols`);
        return allSignals;
    }

    /**
     * Analyze a single symbol and return any triggered signals
     */
    async _analyzeSymbol(symbol, timestamp) {
        const signals = [];

        try {
            // Get 6 months of daily data (enough for EMA200 is too much, EMA50 needs 50, RSI needs 14+)
            const data = await YahooFinanceService.getHistoricalData(symbol, '6mo', '1d');
            if (!data || data.length < 30) return [];

            const closes = data.map(d => d.close);
            const volumes = data.map(d => d.volume);
            const currentPrice = closes[closes.length - 1];
            const prevPrice = closes[closes.length - 2];

            // === 1. RSI Signal ===
            const rsi = RSI.calculate({ values: closes, period: 14 });
            const latestRSI = rsi[rsi.length - 1];
            const prevRSI = rsi[rsi.length - 2];

            if (latestRSI < 30) {
                signals.push(this._buildSignal(symbol, 'BUY', 'RSI Oversold',
                    latestRSI < 25 ? 'STRONG' : 'MODERATE',
                    currentPrice, timestamp,
                    `RSI at ${latestRSI.toFixed(1)} — stock is oversold. Potential reversal opportunity.`
                ));
            } else if (latestRSI > 70) {
                signals.push(this._buildSignal(symbol, 'SELL', 'RSI Overbought',
                    latestRSI > 80 ? 'STRONG' : 'MODERATE',
                    currentPrice, timestamp,
                    `RSI at ${latestRSI.toFixed(1)} — stock is overbought. Consider booking profits.`
                ));
            }

            // === 2. MACD Crossover Signal ===
            if (closes.length >= 26) {
                const macd = MACD.calculate({
                    values: closes,
                    fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
                    SimpleMAOscillator: false, SimpleMASignal: false
                });
                const lastMACD = macd[macd.length - 1];
                const prevMACD = macd[macd.length - 2];

                if (prevMACD && lastMACD) {
                    // Bullish crossover: MACD line crosses above signal line
                    if (prevMACD.MACD < prevMACD.signal && lastMACD.MACD > lastMACD.signal) {
                        signals.push(this._buildSignal(symbol, 'BUY', 'MACD Bullish Crossover',
                            Math.abs(lastMACD.histogram) > 1 ? 'STRONG' : 'MODERATE',
                            currentPrice, timestamp,
                            `MACD crossed above signal line. Momentum shifting bullish.`
                        ));
                    }
                    // Bearish crossover: MACD line crosses below signal line
                    else if (prevMACD.MACD > prevMACD.signal && lastMACD.MACD < lastMACD.signal) {
                        signals.push(this._buildSignal(symbol, 'SELL', 'MACD Bearish Crossover',
                            Math.abs(lastMACD.histogram) > 1 ? 'STRONG' : 'MODERATE',
                            currentPrice, timestamp,
                            `MACD crossed below signal line. Bearish momentum building.`
                        ));
                    }
                }
            }

            // === 3. EMA 50/200 Golden/Death Cross ===
            if (closes.length >= 60) {
                const ema50 = EMA.calculate({ period: 50, values: closes });
                // Only check golden/death cross if we have enough data for both
                if (ema50.length >= 2) {
                    // Use 20-day EMA as shorter average when we don't have 200 days
                    const ema20 = EMA.calculate({ period: 20, values: closes });
                    const lastE50 = ema50[ema50.length - 1];
                    const prevE50 = ema50[ema50.length - 2];
                    const lastE20 = ema20[ema20.length - 1];
                    const prevE20 = ema20[ema20.length - 2];

                    // Golden cross: 20 EMA crosses above 50 EMA
                    if (prevE20 < prevE50 && lastE20 > lastE50) {
                        signals.push(this._buildSignal(symbol, 'BUY', 'Golden Cross (EMA20/50)',
                            'STRONG', currentPrice, timestamp,
                            `20-day EMA crossed above 50-day EMA. Strong bullish trend signal.`
                        ));
                    }
                    // Death cross: 20 EMA crosses below 50 EMA
                    else if (prevE20 > prevE50 && lastE20 < lastE50) {
                        signals.push(this._buildSignal(symbol, 'SELL', 'Death Cross (EMA20/50)',
                            'STRONG', currentPrice, timestamp,
                            `20-day EMA crossed below 50-day EMA. Strong bearish trend signal.`
                        ));
                    }
                }
            }

            // === 4. Bollinger Band Breakout/Squeeze ===
            if (closes.length >= 20) {
                const bb = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
                const lastBB = bb[bb.length - 1];
                const prevBB = bb[bb.length - 2];

                if (lastBB) {
                    if (prevPrice <= prevBB?.lower && currentPrice > lastBB.lower) {
                        signals.push(this._buildSignal(symbol, 'BUY', 'Bollinger Band Bounce',
                            'MODERATE', currentPrice, timestamp,
                            `Price bounced off lower Bollinger Band at ₹${lastBB.lower.toFixed(2)}. Potential support found.`
                        ));
                    } else if (prevPrice >= prevBB?.upper && currentPrice < lastBB.upper) {
                        signals.push(this._buildSignal(symbol, 'SELL', 'Bollinger Band Rejection',
                            'MODERATE', currentPrice, timestamp,
                            `Price rejected at upper Bollinger Band (₹${lastBB.upper.toFixed(2)}). Potential resistance.`
                        ));
                    }
                    // Breakout above upper band
                    if (currentPrice > lastBB.upper && prevPrice <= prevBB?.upper) {
                        signals.push(this._buildSignal(symbol, 'BUY', 'Bollinger Band Breakout',
                            'STRONG', currentPrice, timestamp,
                            `Price broke above upper Bollinger Band. Strong momentum — watch for continuation.`
                        ));
                    }
                }
            }

            // === 5. Unusual Volume Spike ===
            if (volumes.length >= 20) {
                const recentVols = volumes.slice(-20);
                const avgVol = recentVols.reduce((a, b) => a + b, 0) / recentVols.length;
                const todayVol = volumes[volumes.length - 1];
                if (todayVol > avgVol * 2.5) {
                    const direction = currentPrice > prevPrice ? 'BUY' : 'SELL';
                    signals.push(this._buildSignal(symbol, direction, 'Volume Spike',
                        'MODERATE', currentPrice, timestamp,
                        `Volume is ${(todayVol / avgVol).toFixed(1)}x above 20-day average. Institutional activity likely.`
                    ));
                }
            }

        } catch (e) {
            console.warn(`⚠️  Signal analysis failed for ${symbol}: ${e.message}`);
        }

        return signals;
    }

    /**
     * Build a standardized signal object
     */
    _buildSignal(symbol, signalType, signalName, strength, price, createdAt, description) {
        return {
            id: randomUUID(),
            symbol,
            signal_type: signalType,    // BUY | SELL
            signal_name: signalName,
            strength,                    // STRONG | MODERATE | WEAK
            price,
            description,
            created_at: createdAt
        };
    }
}

export default new SignalGeneratorService();
