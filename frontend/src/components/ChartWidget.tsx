import { useState, useEffect } from 'react';
import { StockChart } from './StockChart';
import { apiService } from '../services/api';
import { generateHistoricalData, Timeframe } from '../services/historicalData';
import {
    calculateSMA,
    calculateEMA,
    IndicatorData
} from '../services/technicalIndicators';
import { Stock } from '../types';

interface ChartWidgetProps {
    stock: Stock | null;
}

export const ChartWidget = ({ stock }: ChartWidgetProps) => {
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

    // Fetch data
    useEffect(() => {
        const fetchChartData = async () => {
            if (!stock) return;

            try {
                let interval = '1d';
                switch (timeframe) {
                    case '1D': interval = '1m'; break;
                    case '1W': interval = '15m'; break;
                    case '1M': interval = '1d'; break;
                    case '3M': interval = '1d'; break;
                    case '1Y': interval = '1wk'; break;
                }

                const key = (stock as any).instrumentKey || `NSE_EQ|${stock.symbol}`;
                const candles = await apiService.getHistoricalData(key, interval);

                if (candles && candles.length > 0) {
                    const validCandles = candles.filter((c: any) => c.close > 0 && c.timestamp > 0)
                        .sort((a: any, b: any) => a.timestamp - b.timestamp);

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
                        color: c.close >= c.open ? '#00d09c40' : '#eb5b3c40'
                    }));

                    setChartData({ ohlc, volume });
                } else {
                    // Fallback if no real data
                    const data = generateHistoricalData(stock.ltp || 100, timeframe);
                    setChartData(data);
                }
            } catch (error) {
                console.error("Failed to fetch chart data", error);
                if (stock.ltp) {
                    const data = generateHistoricalData(stock.ltp, timeframe);
                    setChartData(data);
                }
            }
        };

        fetchChartData();
    }, [stock?.symbol, timeframe]);

    // Live Candle Logic
    const [liveCandle, setLiveCandle] = useState<any>(null);

    useEffect(() => {
        if (!stock?.ltp || chartData.ohlc.length === 0) return;

        const lastCandle = chartData.ohlc[chartData.ohlc.length - 1];
        const updatedCandle = {
            ...lastCandle,
            close: stock.ltp,
            high: Math.max(lastCandle.high, stock.ltp),
            low: Math.min(lastCandle.low, stock.ltp),
        };

        setLiveCandle(updatedCandle);
    }, [stock?.ltp, chartData.ohlc]);

    // Calculate Indicators
    useEffect(() => {
        if (chartData.ohlc.length === 0) return;
        const newIndicators: typeof indicators = {};

        if (activeIndicators.includes('SMA20')) newIndicators.sma20 = calculateSMA(chartData.ohlc, 20);
        if (activeIndicators.includes('SMA50')) newIndicators.sma50 = calculateSMA(chartData.ohlc, 50);
        if (activeIndicators.includes('SMA200')) newIndicators.sma200 = calculateSMA(chartData.ohlc, 200);
        if (activeIndicators.includes('EMA12')) newIndicators.ema12 = calculateEMA(chartData.ohlc, 12);
        if (activeIndicators.includes('EMA26')) newIndicators.ema26 = calculateEMA(chartData.ohlc, 26);

        setIndicators(newIndicators);
    }, [chartData, activeIndicators]);

    const toggleIndicator = (ind: string) => {
        setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
    };

    const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

    if (!stock) {
        return (
            <div className="card h-[500px] flex items-center justify-center text-text-secondary bg-surface border border-border">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <p className="text-lg font-medium">Select a stock to view chart</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card flex flex-col h-[600px] border border-border bg-surface shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-text-primary">{stock.symbol}</h2>
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="font-semibold text-text-primary">₹{stock.ltp?.toFixed(2)}</span>
                        <span className={`${(stock.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {stock.change && stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                        {timeframes.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2 py-1 text-xs font-medium rounded transition ${timeframe === tf
                                    ? 'bg-primary text-white'
                                    : 'text-text-secondary hover:bg-surface-hover'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                    <div className="flex space-x-1 border-l border-border pl-4">
                        <button onClick={() => setChartType('candlestick')} className={`p-1 rounded ${chartType === 'candlestick' ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`} title="Candles">📊</button>
                        <button onClick={() => setChartType('line')} className={`p-1 rounded ${chartType === 'line' ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`} title="Line">📈</button>
                    </div>
                </div>
            </div>

            {/* Indicators Toolbar */}
            <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
                {['SMA20', 'SMA50', 'EMA12'].map(ind => (
                    <button
                        key={ind}
                        onClick={() => toggleIndicator(ind)}
                        className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${activeIndicators.includes(ind)
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-transparent text-text-secondary border-transparent hover:bg-surface-hover'
                            }`}
                    >
                        {ind}
                    </button>
                ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-hidden relative">
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
                    <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                        Loading Chart Data...
                    </div>
                )}
            </div>
        </div>
    );
};
