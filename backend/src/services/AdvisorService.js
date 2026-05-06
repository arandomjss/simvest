import {
    RSI,
    MACD,
    BollingerBands,
    EMA
} from 'technicalindicators';
import YahooFinanceService from './YahooFinanceService.js';
import LLMService from './LLMService.js';

class AdvisorService {
    /**
     * Perform deep analysis on a symbol
     */
    async analyzeSymbol(symbol) {
        try {
            console.log(`🧠 Starting deep analysis for ${symbol}...`);

            // 1. Fetch historical data first to check sufficiency
            const historicalDataFull = await YahooFinanceService.getHistoricalData(symbol, '1y', '1d');

            if (!historicalDataFull || historicalDataFull.length < 200) {
                console.warn(`⚠️  Insufficient data for ${symbol} indicators (${historicalDataFull?.length || 0}/200 days)`);
                return this.generateLimitedAnalysis(symbol);
            }

            // 2. Fetch other data in parallel
            const [hourlyData, profile, news] = await Promise.all([
                YahooFinanceService.getHistoricalData(symbol, '5d', '1h'),
                YahooFinanceService.getCompanyProfile(symbol),
                YahooFinanceService.getCompanyNews(symbol)
            ]);

            const dailyCloses = historicalDataFull.map(d => d.close);

            // 3. Calculate Indicators (Daily)
            const rsi = RSI.calculate({ values: dailyCloses, period: 14 });
            const macd = MACD.calculate({
                values: dailyCloses,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            });
            const bb = BollingerBands.calculate({ period: 20, values: dailyCloses, stdDev: 2 });
            const ema50 = EMA.calculate({ period: 50, values: dailyCloses });
            const ema200 = EMA.calculate({ period: 200, values: dailyCloses });

            // Latest values
            const currentPrice = dailyCloses[dailyCloses.length - 1];
            const lastRSI = rsi[rsi.length - 1];
            const lastMACD = macd[macd.length - 1];
            const lastBB = bb[bb.length - 1];
            const lastEMA50 = ema50[ema50.length - 1];
            const lastEMA200 = ema200[ema200.length - 1];

            // 4. Technical Sentiment Calculation
            let score = 0; // -100 to 100
            const signals = [];

            if (lastRSI < 30) { score += 30; signals.push("RSI Oversold"); }
            else if (lastRSI > 70) { score -= 30; signals.push("RSI Overbought"); }

            if (lastMACD && lastMACD.histogram > 0) { score += 20; signals.push("MACD Bullish Histogram"); }
            else { score -= 20; signals.push("MACD Bearish Histogram"); }

            if (currentPrice > lastEMA50) { score += 15; signals.push("Price above 50-day EMA"); }
            if (currentPrice > lastEMA200) { score += 15; signals.push("Price above 200-day EMA"); }

            // 5. News Summary for LLM
            const newsSummary = news.slice(0, 5).map(n => n.title).join('\n');

            // Normalize score to 0-100 confidence baseline for the LLM
            const technicalConfidenceBase = Math.round(50 + (score / 2));

            // 6. Generate AI Thesis
            const prompt = `
                Analyze ${symbol} (${profile?.industry || 'Unknown Industry'}).
                
                Current Market Data:
                - Price: ₹${currentPrice.toFixed(2)}
                - RSI: ${lastRSI.toFixed(2)} (${lastRSI > 70 ? 'Overbought' : lastRSI < 30 ? 'Oversold' : 'Neutral'})
                - MACD Histogram: ${lastMACD?.histogram.toFixed(2) || 'N/A'} (${lastMACD?.histogram > 0 ? 'Bullish' : 'Bearish'})
                - 50-day EMA: ₹${lastEMA50?.toFixed(2) || 'N/A'} (Price is ${currentPrice > lastEMA50 ? 'ABOVE' : 'BELOW'})
                - 200-day EMA: ₹${lastEMA200?.toFixed(2) || 'N/A'} (Price is ${currentPrice > lastEMA200 ? 'ABOVE' : 'BELOW'})
                - Technical Signal Alignment Score: ${score} out of 100 (positive = bullish, negative = bearish)
                - Active Signals: ${signals.join(', ') || 'None'}
                
                Recent News Headlines:
                ${newsSummary || 'No recent news found.'}
                
                Provide a professional "SimVest Verdict" including:
                1. A one-sentence Master Verdict.
                2. A structured rationale (Investment Thesis) in 3 bullet points.
                3. A risk assessment (one sentence).
                4. A confidence score (0-100). Base it on the Signal Alignment Score of ${score}.
                
                Format the response as a valid JSON object with keys: "verdict", "thesis" (array of 3 strings), "risk", "confidence_score". No markdown, no extra text.
            `;

            const aiResponseRaw = await LLMService.generateAnalysis(prompt);

            // Extract JSON from response robustly
            const firstBrace = aiResponseRaw.indexOf('{');
            const lastBrace = aiResponseRaw.lastIndexOf('}');

            let aiAnalysis;
            if (firstBrace !== -1 && lastBrace !== -1) {
                try {
                    const jsonStr = aiResponseRaw.substring(firstBrace, lastBrace + 1);
                    aiAnalysis = JSON.parse(jsonStr);
                } catch (e) {
                    console.warn('⚠️ AI Response parsing failed, using fallback');
                }
            }

            if (!aiAnalysis) {
                aiAnalysis = {
                    verdict: score > 20 ? "Cautious Buy" : score < -20 ? "Strategic Sell" : "Strategic Hold",
                    thesis: ["Technical indicators show consolidation.", "Volume is steady but lacks breakout catalyst.", "Long-term trend remains positive."],
                    risk: "Market-wide volatility and sectoral pressure.",
                    confidence_score: technicalConfidenceBase
                };
            }

            return {
                symbol,
                timestamp: new Date().toISOString(),
                price: currentPrice,
                indicators: {
                    rsi: lastRSI,
                    macd: lastMACD,
                    bb: lastBB,
                    ema50: lastEMA50,
                    ema200: lastEMA200
                },
                signals,
                aiAnalysis,
                profile: {
                    industry: profile?.industry,
                    sector: profile?.sector
                }
            };

        } catch (error) {
            console.error(`❌ Advisor analysis failed for ${symbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Fallback analysis for symbols with limited data
     */
    async generateLimitedAnalysis(symbol) {
        try {
            const [quote, profile, news] = await Promise.all([
                YahooFinanceService.getQuote(symbol),
                YahooFinanceService.getCompanyProfile(symbol),
                YahooFinanceService.getCompanyNews(symbol)
            ]);

            return {
                symbol,
                timestamp: new Date().toISOString(),
                price: quote.price,
                indicators: { message: "Insufficient historical data for complex technical indicators" },
                signals: ["Limited Historical Support"],
                aiAnalysis: {
                    verdict: "Awaiting Data",
                    thesis: [
                        "Insufficient historical data for deep technical charting.",
                        "Initial price action appears steady.",
                        "Awaiting 200-day trend confirmation."
                    ],
                    risk: "Higher volatility expected due to lack of historical trend support.",
                    confidence_score: 30
                },
                profile: {
                    industry: profile?.industry,
                    sector: profile?.sector
                }
            };
        } catch (error) {
            console.error(`❌ Limited analysis failed for ${symbol}:`, error.message);
            throw error;
        }
    }
}

export default new AdvisorService();
