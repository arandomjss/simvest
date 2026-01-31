import { useEffect, useState } from 'react';
import {
    calculateRSI,
    calculateMACD,
    calculateSMA,
    calculateEMA
} from '../services/technicalIndicators';
import { OHLCData } from '../services/historicalData';
import { apiService } from '../services/api';

interface TradeAnalysisProps {
    stock: any;
    currentPrice: number;
}

export const TradeAnalysis = ({ stock, currentPrice }: TradeAnalysisProps) => {
    const [ohlc, setOhlc] = useState<OHLCData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signal, setSignal] = useState<'BUY' | 'SELL' | 'NEUTRAL'>('NEUTRAL');
    const [strength, setStrength] = useState<number>(0); // 0-100
    const [indicators, setIndicators] = useState<{
        rsi: number;
        macd: { value: number; signal: number; histogram: number };
        sma20: number;
        ema50: number;
    } | null>(null);

    // Fetch real historical data
    useEffect(() => {
        const fetchData = async () => {
            if (!stock?.instrumentKey) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch daily candles for analysis
                const candles = await apiService.getHistoricalData(stock.instrumentKey, 'day');

                if (!candles || candles.length === 0) {
                    throw new Error('No historical data available');
                }

                // Map API response (timestamp usually in ms) to OHLCData (time in seconds)
                const mappedData: OHLCData[] = candles.map((c: any) => ({
                    time: Math.floor(c.timestamp / 1000), // Convert ms to s
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close
                })).sort((a: OHLCData, b: OHLCData) => a.time - b.time); // Ensure chronological order

                setOhlc(mappedData);
            } catch (err: any) {
                console.error('Failed to fetch analysis data:', err);
                setError('Could not fetch data for analysis');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [stock.instrumentKey]);

    // Calculate Indicators (only when we have data)
    useEffect(() => {
        if (ohlc.length === 0) return;

        try {
            // RSI
            const rsiData = calculateRSI(ohlc, 14);
            const currentRSI = rsiData[rsiData.length - 1]?.value || 50;

            // MACD
            const macdData = calculateMACD(ohlc);
            const currentMACD = macdData[macdData.length - 1] || { macd: 0, signal: 0, histogram: 0 };

            // SMA & EMA
            const smaData = calculateSMA(ohlc, 20);
            const emaData = calculateEMA(ohlc, 50);
            const currentSMA = smaData[smaData.length - 1]?.value || currentPrice;
            const currentEMA = emaData[emaData.length - 1]?.value || currentPrice;

            setIndicators({
                rsi: currentRSI,
                macd: {
                    value: currentMACD.macd,
                    signal: currentMACD.signal,
                    histogram: currentMACD.histogram
                },
                sma20: currentSMA,
                ema50: currentEMA
            });

            // Determine Signal
            let buyScore = 0;
            let sellScore = 0;

            // RSI Logic
            if (currentRSI < 30) buyScore += 2;
            else if (currentRSI > 70) sellScore += 2;

            // MACD Logic
            if (currentMACD.histogram > 0 && currentMACD.histogram > (macdData[macdData.length - 2]?.histogram || 0)) buyScore += 1;
            if (currentMACD.histogram < 0 && currentMACD.histogram < (macdData[macdData.length - 2]?.histogram || 0)) sellScore += 1;

            // Trend Logic
            // Use last close for trend analysis if currentPrice is 0 or not updated
            const price = currentPrice || ohlc[ohlc.length - 1].close;

            if (price > currentSMA) buyScore += 1;
            else sellScore += 1;

            if (price > currentEMA) buyScore += 1;
            else sellScore += 1;

            // Final Decision
            if (buyScore > sellScore + 1) {
                setSignal('BUY');
                setStrength(Math.min(100, buyScore * 20 + 20)); // Base strength
            } else if (sellScore > buyScore + 1) {
                setSignal('SELL');
                setStrength(Math.min(100, sellScore * 20 + 20));
            } else {
                setSignal('NEUTRAL');
                setStrength(50);
            }
        } catch (err) {
            console.error('Error calculating indicators:', err);
            // Fallback to neutral if calculation fails
            setSignal('NEUTRAL');
            setStrength(0);
        }

    }, [ohlc, currentPrice]);

    const getSignalColor = () => {
        switch (signal) {
            case 'BUY': return 'text-success bg-success/10 border-success/20';
            case 'SELL': return 'text-danger bg-danger/10 border-danger/20';
            default: return 'text-text-secondary bg-gray-100 border-gray-200';
        }
    };

    const getRecommendation = () => {
        if (signal === 'BUY') return `Strong buying momentum detected (RSI: ${indicators?.rsi.toFixed(0)}). Good entry point.`;
        if (signal === 'SELL') return `Overbought or downtrend (RSI: ${indicators?.rsi.toFixed(0)}). Consider selling.`;
        return 'Market is ranging. Wait for a clearer signal.';
    };

    if (isLoading) return <div className="p-4 text-center text-xs text-text-secondary">Fetching real market data...</div>;
    if (error) return <div className="p-4 text-center text-xs text-danger">{error}</div>;
    if (!indicators) return null;

    const support = (currentPrice * 0.98).toFixed(2);
    const resistance = (currentPrice * 1.02).toFixed(2);

    return (
        <div className="bg-background-light/50 rounded-lg p-4 border border-border mt-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary">AI Trade Signal (Real-Time)</h4>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getSignalColor()}`}>
                    {signal} {strength > 0 && `(${strength}%)`}
                </div>
            </div>

            <p className="text-xs text-text-secondary mb-4">{getRecommendation()}</p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-2 bg-background rounded border border-border">
                    <span className="text-text-secondary block mb-1">Support</span>
                    <span className="font-semibold text-success">₹{support}</span>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                    <span className="text-text-secondary block mb-1">Resistance</span>
                    <span className="font-semibold text-danger">₹{resistance}</span>
                </div>
            </div>

            <div className="pt-3 border-t border-border grid grid-cols-3 gap-2 text-[10px] text-text-secondary">
                <div>
                    <span className="block mb-1">RSI (14)</span>
                    <span className={`font-semibold text-xs ${indicators.rsi > 70 ? 'text-danger' : indicators.rsi < 30 ? 'text-success' : 'text-text-primary'}`}>
                        {indicators.rsi.toFixed(2)}
                    </span>
                    <span className="block text-[9px] opacity-70 mt-0.5">
                        {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                    </span>
                </div>
                <div>
                    <span className="block mb-1">MACD</span>
                    <span className={`font-semibold text-xs ${indicators.macd.histogram > 0 ? 'text-success' : 'text-danger'}`}>
                        {indicators.macd.histogram.toFixed(2)}
                    </span>
                    <span className="block text-[9px] opacity-70 mt-0.5">
                        {indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
                    </span>
                </div>
                <div>
                    <span className="block mb-1">Trend (EMA50)</span>
                    <span className={`font-semibold text-xs ${currentPrice > indicators.ema50 ? 'text-success' : 'text-danger'}`}>
                        {currentPrice > indicators.ema50 ? 'Bullish' : 'Bearish'}
                    </span>
                    <span className="block text-[9px] opacity-70 mt-0.5">
                        Short-term
                    </span>
                </div>
            </div>
        </div>
    );
};
