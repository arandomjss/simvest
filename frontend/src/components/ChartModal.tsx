import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockChart } from './StockChart';
import { TradeAnalysis, DeepAnalysisData } from './TradeAnalysis';
import { apiService } from '../services/api';
import { generateHistoricalData, Timeframe } from '../services/historicalData';
import {
    calculateSMA,
    calculateEMA,
    IndicatorData
} from '../services/technicalIndicators';

import { Stock } from '../types';
import { colors } from '../styles/colors';
import { useWatchlistStore } from '../stores/watchlistStore';
import { Star } from 'lucide-react';

interface ChartModalProps {
    stock: Stock;
    onClose: () => void;
}

export const ChartModal = ({ stock, onClose }: ChartModalProps) => {
    const navigate = useNavigate();
    const [timeframe, setTimeframe] = useState<Timeframe>('1M');
    const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
    const [chartData, setChartData] = useState<{
        ohlc: any[];
        volume: any[];
    }>({ ohlc: [], volume: [] });

    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [indicators, setIndicators] = useState<{
        sma20?: IndicatorData[];
        sma50?: IndicatorData[];
        sma200?: IndicatorData[];
        ema12?: IndicatorData[];
        ema26?: IndicatorData[];
    }>({});

    const [analysisData, setAnalysisData] = useState<DeepAnalysisData | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!stock.symbol) return;
            setIsLoadingAnalysis(true);
            try {
                const data = await apiService.getDeepAnalysis(stock.symbol);
                setAnalysisData(data);
            } catch (error) {
                console.error("Failed to fetch analysis", error);
            } finally {
                setIsLoadingAnalysis(false);
            }
        };

        fetchAnalysis();
    }, [stock.symbol]);


    // Generate chart data when timeframe changes
    useEffect(() => {
        const fetchChartData = async () => {
            if (!stock.symbol) return;

            try {
                // Map timeframe to API interval/range
                let interval = '1d';
                let period = '1mo';

                switch (timeframe) {
                    case '1D':
                        interval = '2m'; // 2 minute interval for 1 day
                        period = '1d';
                        break;
                    case '1W':
                        interval = '15m'; // 15 min interval for 1 week
                        period = '5d';
                        break;
                    case '1M':
                        interval = '1d';
                        period = '1mo';
                        break;
                    case '3M':
                        interval = '1d';
                        period = '3mo';
                        break;
                    case '1Y':
                        interval = '1wk';
                        period = '1y';
                        break;
                }

                // Use apiService directly (we might need to update apiService to support range param if backend allows)
                // Current backend implementation for /historical/:key primarily looks at interval.
                // Let's pass the mapped interval.
                // Note: We need instrumentKey. If stock prop doesn't have it, we might need to derive it or pass it.
                // Assuming stock matches Stock interface or has instrumentKey.
                // If not, we fall back to generating via symbol if backend supports it, but endpoint is /historical/:instrumentKey.
                // We'll trust the parent passes a valid object, or update Props.

                const key = (stock as any).instrumentKey || calculateInstrumentKey(stock.symbol);
                const candles = await apiService.getHistoricalData(key, interval, period);

                if (candles && candles.length > 0) {
                    const validCandles = candles.filter((c: any) => c.close > 0 && c.timestamp > 0);

                    const ohlc = validCandles.map((c: any) => ({
                        time: c.timestamp / 1000,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close
                    }));

                    const volume = validCandles.map((c: any) => ({
                        time: c.timestamp / 1000,
                        value: c.volume,
                        color: c.close >= c.open ? `${colors.success.DEFAULT}40` : `${colors.danger.DEFAULT}40`
                    }));

                    setChartData({ ohlc, volume });
                } else {
                    throw new Error("No data returned");
                }
            } catch (error) {
                console.error("Failed to fetch chart data", error);
                // Fallback to mock if fetch fails?
                if (stock.ltp) {
                    const key = (stock as any).instrumentKey || calculateInstrumentKey(stock.symbol);
                    const data = generateHistoricalData(stock.ltp, timeframe, key);
                    setChartData(data);
                }
            }
        };

        fetchChartData();
    }, [stock.symbol, timeframe]);

    // Helper to generate key if missing (nifty50 config logic)
    const calculateInstrumentKey = (symbol: string) => {
        return `NSE_EQ|${symbol}`;
    };

    // Live Candle Logic
    const [liveCandle, setLiveCandle] = useState<any>(null); // Use existing type logic

    useEffect(() => {
        if (!stock.ltp || chartData.ohlc.length === 0) return;

        // Get the last candle from history
        const lastCandle = chartData.ohlc[chartData.ohlc.length - 1];

        // This is a simplified "Update Last Candle" logic.
        // It assumes the last candle fetched aligns with current time (e.g. today's daily candle).
        // If stock.ltp updates, we update High/Low/Close of that same candle.

        // NOTE: Ideally we check timestamps. If fetched data is old, we might need a new candle.
        // For now, updating the last candle gives instant feedback for "today".

        // Don't mutate, create new object
        const updatedCandle = {
            ...lastCandle,
            close: stock.ltp, // Set Close to current LTP
            high: Math.max(lastCandle.high, stock.ltp), // Update High
            low: Math.min(lastCandle.low, stock.ltp),  // Update Low
        };

        setLiveCandle(updatedCandle);

    }, [stock.ltp, chartData.ohlc]); // Re-run when LTP changes or we get new history

    // Calculate indicators when chart data or active indicators change
    useEffect(() => {
        if (chartData.ohlc.length === 0) return;

        const newIndicators: typeof indicators = {};

        if (activeIndicators.includes('SMA20')) {
            newIndicators.sma20 = calculateSMA(chartData.ohlc, 20);
        }
        if (activeIndicators.includes('SMA50')) {
            newIndicators.sma50 = calculateSMA(chartData.ohlc, 50);
        }
        if (activeIndicators.includes('SMA200')) {
            newIndicators.sma200 = calculateSMA(chartData.ohlc, 200);
        }
        if (activeIndicators.includes('EMA12')) {
            newIndicators.ema12 = calculateEMA(chartData.ohlc, 12);
        }
        if (activeIndicators.includes('EMA26')) {
            newIndicators.ema26 = calculateEMA(chartData.ohlc, 26);
        }


        setIndicators(newIndicators);
    }, [chartData, activeIndicators]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

    const toggleIndicator = (indicator: string) => {
        setActiveIndicators(prev =>
            prev.includes(indicator)
                ? prev.filter(i => i !== indicator)
                : [...prev, indicator]
        );
    };

    const formatChange = () => {
        if (!stock.change || !stock.changePercent) return null;
        const sign = stock.change >= 0 ? '+' : '';
        const color = stock.change >= 0 ? 'text-profit' : 'text-loss';
        return (
            <span className={`${color} text-sm font-medium`}>
                {sign}₹{stock.change.toFixed(2)} ({sign}{stock.changePercent.toFixed(2)}%)
            </span>
        );
    };

    const handleTradeRedirect = (side: 'BUY' | 'SELL') => {
        navigate(`/practice?symbol=${stock.symbol}&side=${side}`);
        onClose();
    };

    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const inWatchlist = isInWatchlist(stock.instrumentKey);

    const handleToggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(stock.instrumentKey);
        } else {
            addToWatchlist(stock.instrumentKey);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-6xl h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold text-text-primary">{stock.symbol}</h2>
                                <button
                                    onClick={handleToggleWatchlist}
                                    className={`p-1.5 rounded-full transition ${inWatchlist ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                    title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                                >
                                    <Star className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-2xl font-bold text-text-primary">
                                    ₹{stock.ltp?.toFixed(2) || '0.00'}
                                </span>
                                {formatChange()}
                            </div>
                            <span className="text-[10px] text-text-secondary mt-1 block">
                                Last Updated: {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }) : 'Live'}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-border"></div>

                        {/* Trade Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleTradeRedirect('BUY')}
                                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded shadow-md flex items-center gap-2 transform active:scale-95 transition-all"
                            >
                                <span>B</span> Buy
                            </button>
                            <button
                                onClick={() => handleTradeRedirect('SELL')}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded shadow-md flex items-center gap-2 transform active:scale-95 transition-all"
                            >
                                <span>S</span> Sell
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition p-2"
                        title="Close (Esc)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 border-b border-border bg-background space-y-3">
                    {/* Timeframe & Chart Type */}
                    <div className="flex items-center justify-between">
                        {/* Timeframe Selector */}
                        <div className="flex space-x-1">
                            {timeframes.map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded transition ${timeframe === tf
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:bg-surface-hover'
                                        }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>

                        {/* Chart Type Toggle */}
                        <div className="flex space-x-1 bg-surface rounded p-1">
                            <button
                                onClick={() => setChartType('candlestick')}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition ${chartType === 'candlestick'
                                    ? 'bg-primary text-white'
                                    : 'text-text-secondary hover:bg-surface-hover'
                                    }`}
                                title="Candlestick Chart"
                            >
                                📊 Candles
                            </button>
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition ${chartType === 'line'
                                    ? 'bg-primary text-white'
                                    : 'text-text-secondary hover:bg-surface-hover'
                                    }`}
                                title="Line Chart"
                            >
                                📈 Line
                            </button>
                        </div>
                    </div>

                    {/* Indicator Toggles */}
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <span className="text-xs text-text-secondary font-medium">Indicators:</span>

                        {/* Moving Averages */}
                        {['SMA20', 'SMA50', 'SMA200', 'EMA12', 'EMA26'].map(ind => (
                            <button
                                key={ind}
                                onClick={() => toggleIndicator(ind)}
                                className={`px-2 py-1 text-xs font-medium rounded transition ${activeIndicators.includes(ind)
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-text-secondary hover:bg-surface-hover'
                                    }`}
                            >
                                {ind}
                            </button>
                        ))}

                        <div className="border-l border-border h-6 mx-1" />

                        {/* Oscillators */}

                    </div>
                </div>

                {/* Main Content: Chart + Analysis */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Chart Area */}
                    <div className="flex-1 p-4 min-h-[400px] md:min-h-0 relative">
                        {chartData.ohlc.length > 0 ? (
                            <StockChart
                                ohlcData={chartData.ohlc}
                                volumeData={chartData.volume}
                                chartType={chartType}
                                indicators={indicators}
                                activeIndicators={activeIndicators}
                                liveCandle={liveCandle}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-secondary">
                                Loading Chart...
                            </div>
                        )}
                    </div>

                    {/* Analysis Sidebar */}
                    <div className="w-full md:w-[350px] border-l border-border bg-gray-50 dark:bg-slate-800/50 p-4 overflow-y-auto custom-scrollbar">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                <span>🤖</span> Market Verdict
                            </h3>
                            <p className="text-xs text-text-secondary">
                                Real-time technical analysis based on 6-month trend data.
                            </p>
                        </div>
                        <TradeAnalysis
                            analysis={analysisData}
                            isLoading={isLoadingAnalysis}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
