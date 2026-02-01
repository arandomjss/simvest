import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { TradeForm } from '../components/TradeForm';
import { StockChart } from '../components/StockChart';
import { useMarketStore } from '../stores/marketStore';
import { generateHistoricalData, Timeframe } from '../services/historicalData';
import {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands
} from '../services/technicalIndicators';
import { StockSelector } from '../components/StockSelector';

export const PracticePage = () => {
    const [searchParams] = useSearchParams();
    const initialSymbol = searchParams.get('symbol');

    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket } = useMarketStore();

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
    const [chartType] = useState<'candlestick' | 'line'>('candlestick');
    const [chartData, setChartData] = useState<{ ohlc: any[], volume: any[] }>({ ohlc: [], volume: [] });
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [indicators, setIndicators] = useState<any>({});
    const [liveCandle, setLiveCandle] = useState<any>(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchInstruments();
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);

    // Generate Chart Data when Stock/Timeframe changes
    useEffect(() => {
        if (!activeStock) return;

        const seed = activeStock.instrumentKey;
        const data = generateHistoricalData(activeStock.ltp || 100, timeframe, seed);

        setChartData(data);
        setLiveCandle(null); // Reset live candle on new chart
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

        const newIndicators: any = {};
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

    if (!activeStock) return <div className="text-center p-10">Loading Market...</div>;

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
            <Navbar showSearch={false} />

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL: CHART & TOOLS (65%) */}
                <div className="flex-[2] flex flex-col border-r border-gray-200 dark:border-slate-700 min-w-0">
                    {/* Header Bar */}
                    <div className="h-16 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm relative z-20">
                        <div className="flex items-center space-x-6">
                            {/* Stock Command Bar */}
                            <StockSelector
                                selectedSymbol={selectedSymbol}
                                onSelect={setSelectedSymbol}
                            />

                            <div className="flex flex-col">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono shadow-md">
                                    ₹{activeStock.ltp?.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`text-xs font-semibold ${(activeStock.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {(activeStock.change || 0) >= 0 ? '+' : ''}{activeStock.change?.toFixed(2)} ({(activeStock.changePercent || 0).toFixed(2)}%)
                                    </div>
                                    <div className="text-[10px] text-text-secondary opacity-60">
                                        • {activeStock.lastUpdated ? new Date(activeStock.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Tools */}
                        <div className="flex items-center space-x-2">
                            {['1D', '1W', '1M', '3M', '1Y'].map((tf: any) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-3 py-1 text-xs font-medium rounded transition ${timeframe === tf ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-hover'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                            <div className="h-4 w-px bg-border mx-2"></div>
                            {['SMA20', 'SMA50', 'EMA12', 'BB'].map(ind => (
                                <button
                                    key={ind}
                                    onClick={() => toggleIndicator(ind)}
                                    className={`px-2 py-1 text-xs font-medium rounded border ${activeIndicators.includes(ind) ? 'bg-primary/10 text-primary border-primary/20' : 'bg-transparent text-text-secondary border-transparent hover:border-border'}`}
                                >
                                    {ind}
                                </button>
                            ))}
                            <div className="h-4 w-px bg-border mx-2"></div>
                            {['RSI', 'MACD'].map(ind => (
                                <button
                                    key={ind}
                                    onClick={() => toggleIndicator(ind)}
                                    className={`px-2 py-1 text-xs font-medium rounded border ${activeIndicators.includes(ind) ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-transparent text-text-secondary border-transparent hover:border-border'}`}
                                >
                                    {ind}
                                </button>
                            ))}
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
                        onSuccess={() => {
                            console.log('Trade Executed');
                        }}
                    />

                    <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <h3 className="text-sm font-semibold text-primary mb-2">Live Terminal ⚡</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            This is your active trading environment. Use the chart to identify entry/exit points and execute orders instantly.
                            <br /><br />
                            <strong>System Status:</strong> <span className="text-profit">Online</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
