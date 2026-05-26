import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { TradeForm } from '../components/TradeForm';
import { StockChart } from '../components/StockChart';
import { useMarketStore } from '../stores/marketStore';
import { generateHistoricalData, Timeframe, OHLCData, VolumeData } from '../services/historicalData';
import {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands
} from '../services/technicalIndicators';
import { StockSelector } from '../components/StockSelector';
import { apiService } from '../services/api';
import { IndicatorsDropdown } from '../components/IndicatorsDropdown';
import { ChevronDown, CandlestickChart, BarChart3, LineChart, AreaChart, TrendingUp } from 'lucide-react';

export const PracticePage = () => {
    const [searchParams] = useSearchParams();
    const initialSymbol = searchParams.get('symbol');

    const { stocks, fetchInstruments } = useMarketStore();

    // Local state for stock selection
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(initialSymbol || null);

    // Derived active stock object
    const activeStock = useMemo(() => {
        if (!selectedSymbol) return stocks[0] || null;
        return stocks.find(s => s.symbol === selectedSymbol) || stocks[0] || null;
    }, [stocks, selectedSymbol]);

    // Update active stock if URL param changes or stocks load
    useEffect(() => {
        if (initialSymbol && stocks.length > 0) {
            setSelectedSymbol(initialSymbol);
        } else if (stocks.length > 0 && !selectedSymbol) {
            setSelectedSymbol(stocks[0].symbol);
        }
    }, [initialSymbol, stocks]);

    // Chart State
    const [timeframe, setTimeframe] = useState<Timeframe>('1D');
    const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area' | 'bar' | 'baseline' | 'renko' | 'pointAndFigure'>('candlestick');
    const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
    const chartTypeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chartTypeRef.current && !chartTypeRef.current.contains(event.target as Node)) {
                setIsChartTypeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    interface CandleData { timestamp: number; open: number; high: number; low: number; close: number; volume: number; }
    
    const [chartData, setChartData] = useState<{ ohlc: OHLCData[]; volume: VolumeData[] }>({ ohlc: [], volume: [] });
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [indicators, setIndicators] = useState<Record<string, unknown>>({});
    const [liveCandle, setLiveCandle] = useState<OHLCData | undefined>(undefined);

    useEffect(() => {
        fetchInstruments();
    }, []);

    // Generate Chart Data when Stock/Timeframe changes
    useEffect(() => {
        const fetchChartData = async () => {
            if (!activeStock) return;
            setLiveCandle(undefined);

            try {
                // Map timeframe to API interval and period
                let interval = '15m'; // Default
                let period = '1mo';   // Default

                switch (timeframe) {
                    case '1D':
                        interval = '5m';  // 5m interval is robust for 5 days of history
                        period = '5d';    // Fetch 5 days of data, allowing scrolling back
                        break;
                    case '1W':
                        interval = '30m';
                        period = '1mo';   // Fetch 1 month, allowing scrolling back
                        break;
                    case '1M':
                        interval = '1d';
                        period = '6mo';   // Fetch 6 months of daily history
                        break;
                    case '3M':
                        interval = '1d';
                        period = '1y';    // Fetch 1 full year of history
                        break;
                    case '1Y':
                        interval = '1wk';
                        period = '5y';    // Fetch 5 years of weekly candles
                        break;
                }

                const key = activeStock.instrumentKey;
                const candles = await apiService.getHistoricalData(key, interval, period);

                if (candles && candles.length > 0) {
                    const validCandles = candles.filter((c: CandleData) => c.close > 0 && c.timestamp > 0);

                    if (validCandles.length > 0) {
                        // Detect and correct system clock/API time drift (e.g. system is set to the future, or API is stale)
                        const lastApiTimestamp = validCandles[validCandles.length - 1].timestamp;
                        const currentSystemTimestamp = Date.now();
                        
                        // If drift is larger than 1 day (86400000 ms), shift all timestamps to align the last candle with now
                        const driftThreshold = 24 * 60 * 60 * 1000;
                        const timeOffset = Math.abs(currentSystemTimestamp - lastApiTimestamp) > driftThreshold
                            ? currentSystemTimestamp - lastApiTimestamp
                            : 0;

                        const ohlc = validCandles.map((c: CandleData) => ({
                            time: Math.floor((c.timestamp + timeOffset) / 1000),
                            open: c.open,
                            high: c.high,
                            low: c.low,
                            close: c.close
                        }));

                        const volume = validCandles.map((c: CandleData) => ({
                            time: Math.floor((c.timestamp + timeOffset) / 1000),
                            value: c.volume,
                            color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                        }));

                        setChartData({ ohlc, volume });
                    } else {
                        throw new Error("No valid candles after filtering");
                    }
                } else {
                    throw new Error("No API data");
                }
            } catch (err) {
                console.warn("API Chart failed, using mock", err);
                const seed = activeStock.instrumentKey;
                const data = generateHistoricalData(activeStock.ltp || 100, timeframe, seed);
                setChartData(data);
            }
        };

        fetchChartData();
    }, [activeStock?.instrumentKey, timeframe]);

    // Live Chart Updates
    useEffect(() => {
        if (!activeStock?.ltp || chartData.ohlc.length === 0) return;

        const lastCandle = chartData.ohlc[chartData.ohlc.length - 1];

        // Simulating live candle update
        const updatedCandle = {
            ...lastCandle,
            close: activeStock.ltp,
            high: Math.max(lastCandle.high, activeStock.ltp),
            low: Math.min(lastCandle.low, activeStock.ltp)
        };

        setLiveCandle(updatedCandle);
    }, [activeStock?.ltp, chartData.ohlc]);

    // Update Indicators
    useEffect(() => {
        if (chartData.ohlc.length === 0) return;

        const newIndicators: Record<string, unknown> = {};
        if (activeIndicators.includes('SMA20')) newIndicators.sma20 = calculateSMA(chartData.ohlc, 20);
        if (activeIndicators.includes('SMA50')) newIndicators.sma50 = calculateSMA(chartData.ohlc, 50);
        if (activeIndicators.includes('SMA200')) newIndicators.sma200 = calculateSMA(chartData.ohlc, 200);
        if (activeIndicators.includes('EMA12')) newIndicators.ema12 = calculateEMA(chartData.ohlc, 12);
        if (activeIndicators.includes('EMA26')) newIndicators.ema26 = calculateEMA(chartData.ohlc, 26);

        // New Indicators
        if (activeIndicators.includes('BB')) newIndicators.bollinger = calculateBollingerBands(chartData.ohlc, 20, 2);
        if (activeIndicators.includes('RSI')) newIndicators.rsi = calculateRSI(chartData.ohlc, 14);
        if (activeIndicators.includes('MACD')) newIndicators.macd = calculateMACD(chartData.ohlc);

        setIndicators(newIndicators);
    }, [chartData, activeIndicators]);


    const toggleIndicator = (ind: string) => {
        setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
    };

    const isMarketOpen = () => {
        const now = new Date();
        const day = now.getDay();
        if (day === 0 || day === 6) return false;
        
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeVal = hours * 60 + minutes;
        
        // NSE/BSE: 9:15 AM (555) to 3:30 PM (930)
        return timeVal >= 555 && timeVal <= 930;
    };

    if (!activeStock) return <div className="text-center p-10 bg-gray-50 dark:bg-slate-900 text-slate-500 h-screen flex items-center justify-center font-semibold">Loading Market Terminal...</div>;

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex-none">
                <Navbar />
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL: CHART & TOOLS (65%) */}
                <div className="flex-[2] flex flex-col border-r border-gray-200 dark:border-slate-700 min-w-0">
                    {/* Header Bar */}
                    <div className="h-16 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm relative z-20">
                        <div className="flex items-center space-x-6">
                            <div className="w-56">
                                <StockSelector
                                    selectedSymbol={selectedSymbol}
                                    onSelect={setSelectedSymbol}
                                />
                            </div>

                            <div className="h-8 w-px bg-border"></div>

                            <div className="flex flex-col">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono leading-none">
                                    ₹{activeStock.ltp?.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`text-xs font-semibold ${(activeStock.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {(activeStock.change || 0) >= 0 ? '+' : ''}{activeStock.change?.toFixed(2)} ({(activeStock.changePercent || 0).toFixed(2)}%)
                                    </div>
                                    <div className="text-[10px] text-text-secondary opacity-60">
                                        • {activeStock.lastUpdated ? new Date(activeStock.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                                    {isMarketOpen() ? (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/70 dark:border-emerald-900/30 text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                            Market Open
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">
                                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                                            Market Closed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chart Tools */}
                        <div className="flex items-center space-x-3">
                            {/* Timeframe Segment */}
                            <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700/50">
                                {['1D', '1W', '1M', '3M', '1Y'].map((tf: any) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all duration-150 ${
                                            timeframe === tf
                                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                            <div className="h-4 w-px bg-border"></div>

                            {/* Chart Style Selector Dropdown */}
                            <div className="relative" ref={chartTypeRef}>
                                <button
                                    onClick={() => setIsChartTypeOpen(!isChartTypeOpen)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                                        isChartTypeOpen
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : 'bg-white dark:bg-slate-800 text-text-secondary border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                    title="Select Chart Style"
                                >
                                    <span className="text-primary flex items-center justify-center">
                                        {chartType === 'candlestick' && <CandlestickChart size={13} />}
                                        {chartType === 'bar' && <BarChart3 size={13} />}
                                        {chartType === 'line' && <LineChart size={13} />}
                                        {chartType === 'area' && <AreaChart size={13} />}
                                        {chartType === 'baseline' && <TrendingUp size={13} />}
                                    </span>
                                    <span className="capitalize text-[10px] font-bold">
                                        {chartType === 'candlestick' ? 'Candles' : chartType === 'bar' ? 'Bars' : chartType === 'pointAndFigure' ? 'Point & Figure' : chartType}
                                    </span>
                                    <ChevronDown size={10} className={`opacity-60 transition-transform duration-200 ${isChartTypeOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isChartTypeOpen && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                        {[
                                            { id: 'candlestick', label: 'Candlestick', icon: <CandlestickChart size={12} /> },
                                            { id: 'bar', label: 'OHLC Bars', icon: <BarChart3 size={12} /> },
                                            { id: 'line', label: 'Line Chart', icon: <LineChart size={12} /> },
                                            { id: 'area', label: 'Area Chart', icon: <AreaChart size={12} /> },
                                            { id: 'baseline', label: 'Baseline', icon: <TrendingUp size={12} /> },
                                            { id: 'renko', label: 'Renko', icon: <BarChart3 size={12} /> },
                                            { id: 'pointAndFigure', label: 'Point & Figure', icon: <TrendingUp size={12} /> }
                                        ].map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => {
                                                    setChartType(style.id as any);
                                                    setIsChartTypeOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                                    chartType === style.id
                                                        ? 'bg-primary/10 text-primary font-bold'
                                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                <span className={chartType === style.id ? 'text-primary flex items-center' : 'text-gray-400 dark:text-gray-500 flex items-center'}>
                                                    {style.icon}
                                                </span>
                                                <span>{style.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="h-4 w-px bg-border"></div>
                            <IndicatorsDropdown
                                activeIndicators={activeIndicators}
                                onToggleIndicator={toggleIndicator}
                            />
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 bg-background relative">
                        {chartData.ohlc.length > 0 && (
                            <StockChart
                                ohlcData={chartData.ohlc}
                                volumeData={chartData.volume}
                                chartType={chartType}
                                indicators={indicators}
                                activeIndicators={activeIndicators}
                                liveCandle={liveCandle}
                                timeframe={timeframe}
                            />
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: EXECUTION (35%) */}
                <div className="flex-[1] bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-6 flex flex-col max-w-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Trade Terminal</h2>

                    <TradeForm
                        stock={activeStock}
                        initialSide={(searchParams.get('side') as 'BUY' | 'SELL') || 'BUY'}
                        onSuccess={() => {}}
                    />

                </div>
            </div>
        </div>
    );
};
