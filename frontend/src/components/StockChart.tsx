import { useEffect, useRef } from 'react';
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    HistogramSeries,
    IChartApi,
    ISeriesApi,
    Time
} from 'lightweight-charts';
import { OHLCData, VolumeData } from '../services/historicalData';
import { IndicatorData, MACDData, BollingerBandsData, getMACDHistogramColor } from '../services/technicalIndicators';

interface StockChartProps {
    ohlcData: OHLCData[];
    volumeData: VolumeData[];
    chartType: 'candlestick' | 'line';
    indicators?: {
        sma20?: IndicatorData[];
        sma50?: IndicatorData[];
        sma200?: IndicatorData[];
        ema12?: IndicatorData[];
        ema26?: IndicatorData[];
        bollinger?: BollingerBandsData[];
        rsi?: IndicatorData[];
        macd?: MACDData[];
    };
    activeIndicators?: string[];
    liveCandle?: OHLCData | null;
}

export const StockChart = ({
    ohlcData,
    volumeData,
    chartType,
    indicators = {},
    activeIndicators = [],
    liveCandle
}: StockChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Main Chart Refs
    const mainChartContainerRef = useRef<HTMLDivElement>(null);
    const mainChartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const overlaySeriesRefs = useRef<{ [key: string]: ISeriesApi<"Line"> }>({});

    // Indicator Chart Refs (RSI, MACD)
    const rsiChartContainerRef = useRef<HTMLDivElement>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    const macdChartContainerRef = useRef<HTMLDivElement>(null);
    const macdChartRef = useRef<IChartApi | null>(null);
    const macdSeriesRefs = useRef<{ macd?: ISeriesApi<"Line">, signal?: ISeriesApi<"Line">, hist?: ISeriesApi<"Histogram"> }>({});


    // Helper to create chart options
    const getChartOptions = (height: number) => ({
        width: containerRef.current?.clientWidth || 0,
        height,
        layout: { background: { color: 'transparent' }, textColor: '#d1d4dc' },
        grid: { vertLines: { color: 'rgba(42, 46, 57, 0.5)' }, horzLines: { color: 'rgba(42, 46, 57, 0.5)' } },
        timeScale: { timeVisible: true, secondsVisible: false },
    });

    // 1. Initialize & Resize Logic for ALL Charts
    useEffect(() => {
        if (!mainChartContainerRef.current) return;

        // --- Main Chart ---
        if (!mainChartRef.current) {
            mainChartRef.current = createChart(mainChartContainerRef.current, getChartOptions(400));
        }

        // --- RSI Chart ---
        if (activeIndicators.includes('RSI') && rsiChartContainerRef.current) {
            if (!rsiChartRef.current) {
                rsiChartRef.current = createChart(rsiChartContainerRef.current, {
                    ...getChartOptions(150),
                    timeScale: { visible: false }, // Hide Time on sub-charts to avoid clutter
                });
            }
        } else if (rsiChartRef.current) {
            // Remove if disabled
            rsiChartRef.current.remove();
            rsiChartRef.current = null;
        }

        // --- MACD Chart ---
        if (activeIndicators.includes('MACD') && macdChartContainerRef.current) {
            if (!macdChartRef.current) {
                macdChartRef.current = createChart(macdChartContainerRef.current, {
                    ...getChartOptions(150),
                    timeScale: { visible: false },
                });
            }
        } else if (macdChartRef.current) {
            macdChartRef.current.remove();
            macdChartRef.current = null;
        }

        // Sync Time Scales
        const mainTimeScale = mainChartRef.current.timeScale();
        const subCharts = [rsiChartRef.current, macdChartRef.current].filter(c => c !== null) as IChartApi[];

        // Simple 1-way sync from Main -> Subs (usually enough for browsing)
        // For full bi-directional sync we'd need more event listeners, but let's stick to main driving subs for stability
        mainTimeScale.subscribeVisibleTimeRangeChange((range) => {
            subCharts.forEach(c => {
                if (range) c.timeScale().setVisibleRange(range);
            });
        });


        const handleResize = () => {
            const w = containerRef.current?.clientWidth || 0;
            mainChartRef.current?.applyOptions({ width: w });
            rsiChartRef.current?.applyOptions({ width: w });
            macdChartRef.current?.applyOptions({ width: w });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Note: We don't destroy charts here on every re-render to allow updates, 
            // but strictly we should clean up on unmount.
        };
    }, [activeIndicators]); // Re-run when indicators toggle to create/destroy panes


    // 2. Main Series & Overlays Update
    useEffect(() => {
        if (!mainChartRef.current) return;

        try {
            // --- Clean/Re-add Main ---
            if (mainSeriesRef.current) mainChartRef.current.removeSeries(mainSeriesRef.current);
            if (volumeSeriesRef.current) mainChartRef.current.removeSeries(volumeSeriesRef.current);

            if (chartType === 'candlestick') {
                mainSeriesRef.current = mainChartRef.current.addSeries(CandlestickSeries, {
                    upColor: '#00d09c', downColor: '#eb5b3c',
                    borderUpColor: '#00d09c', borderDownColor: '#eb5b3c',
                    wickUpColor: '#00d09c', wickDownColor: '#eb5b3c',
                });
                mainSeriesRef.current.setData(ohlcData.map(d => ({ ...d, time: d.time as Time })));
            } else {
                mainSeriesRef.current = mainChartRef.current.addSeries(LineSeries, { color: '#387ed1', lineWidth: 2 });
                mainSeriesRef.current.setData(ohlcData.map(d => ({ time: d.time as Time, value: d.close })));
            }

            // --- Volume ---
            volumeSeriesRef.current = mainChartRef.current.addSeries(HistogramSeries, {
                color: '#26a69a',
                priceFormat: { type: 'volume' },
                priceScaleId: '',
            });
            volumeSeriesRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
            volumeSeriesRef.current.setData(volumeData.map(d => ({ ...d, time: d.time as Time })));


            // --- Overlays (SMA/EMA/Bollinger) ---
            Object.values(overlaySeriesRefs.current).forEach(s => {
                try { mainChartRef.current?.removeSeries(s); } catch (e) { }
            });
            overlaySeriesRefs.current = {};

            const addOverlay = (data: any[], color: string, title: string) => {
                if (data && data.length > 0 && mainChartRef.current) {
                    const s = mainChartRef.current.addSeries(LineSeries, { color, lineWidth: 1, title });
                    s.setData(data.map(d => ({ time: d.time as Time, value: d.value })));
                    overlaySeriesRefs.current[title] = s;
                }
            };

            if (activeIndicators.includes('SMA20')) addOverlay(indicators.sma20 || [], '#ff9800', 'SMA20');
            if (activeIndicators.includes('SMA50')) addOverlay(indicators.sma50 || [], '#9c27b0', 'SMA50');
            if (activeIndicators.includes('SMA200')) addOverlay(indicators.sma200 || [], '#2196f3', 'SMA200');
            if (activeIndicators.includes('EMA12')) addOverlay(indicators.ema12 || [], '#4caf50', 'EMA12');
            if (activeIndicators.includes('EMA26')) addOverlay(indicators.ema26 || [], '#f44336', 'EMA26');

            if (activeIndicators.includes('BB') && indicators.bollinger && indicators.bollinger.length > 0) {
                const upper = mainChartRef.current.addSeries(LineSeries, { color: 'rgba(33, 150, 243, 0.5)', lineWidth: 1, title: 'BB Upper' });
                const lower = mainChartRef.current.addSeries(LineSeries, { color: 'rgba(33, 150, 243, 0.5)', lineWidth: 1, title: 'BB Lower' });
                const middle = mainChartRef.current.addSeries(LineSeries, { color: 'rgba(33, 150, 243, 0.8)', lineWidth: 1, title: 'BB Middle' }); // Same as SMA20 technically

                upper.setData(indicators.bollinger.map(d => ({ time: d.time as Time, value: d.upper })));
                lower.setData(indicators.bollinger.map(d => ({ time: d.time as Time, value: d.lower })));
                middle.setData(indicators.bollinger.map(d => ({ time: d.time as Time, value: d.middle })));

                overlaySeriesRefs.current['BB_Upper'] = upper;
                overlaySeriesRefs.current['BB_Lower'] = lower;
                overlaySeriesRefs.current['BB_Middle'] = middle;
            }

        } catch (error) {
            console.error("Main Chart Update Error:", error);
        }
    }, [ohlcData, volumeData, indicators, activeIndicators, chartType]);


    // 3. RSI Chart Update
    useEffect(() => {
        if (!rsiChartRef.current || !activeIndicators.includes('RSI')) return;

        try {
            // Re-create series to ensure clean state
            if (rsiSeriesRef.current) rsiChartRef.current.removeSeries(rsiSeriesRef.current);

            // Add Baseline for 70/30 marks? Lightweight charts has specific BaselineSeries or we can use GridLines?
            // Simplest is just the line for now.
            rsiSeriesRef.current = rsiChartRef.current.addSeries(LineSeries, {
                color: '#7e57c2',
                lineWidth: 2,
                title: 'RSI(14)'
            });
            if (indicators.rsi) {
                rsiSeriesRef.current.setData(indicators.rsi.map(d => ({ time: d.time as Time, value: d.value })));
            }
        } catch (e) {
            console.error("RSI Update Error", e);
        }
    }, [indicators.rsi, activeIndicators]);


    // 4. MACD Chart Update
    useEffect(() => {
        if (!macdChartRef.current || !activeIndicators.includes('MACD')) return;

        try {
            // Clear existing
            if (macdSeriesRefs.current.macd) macdChartRef.current.removeSeries(macdSeriesRefs.current.macd);
            if (macdSeriesRefs.current.signal) macdChartRef.current.removeSeries(macdSeriesRefs.current.signal);
            if (macdSeriesRefs.current.hist) macdChartRef.current.removeSeries(macdSeriesRefs.current.hist);

            // Histogram first (background)
            const histSeries = macdChartRef.current.addSeries(HistogramSeries, { title: 'Histogram', color: '#26a69a' });
            macdSeriesRefs.current.hist = histSeries;

            // MACD Line (Fast)
            const macdSeries = macdChartRef.current.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2, title: 'MACD' });
            macdSeriesRefs.current.macd = macdSeries;

            // Signal Line (Slow)
            const signalSeries = macdChartRef.current.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2, title: 'Signal' });
            macdSeriesRefs.current.signal = signalSeries;

            if (indicators.macd) {
                histSeries.setData(indicators.macd.map(d => ({ time: d.time as Time, value: d.histogram, color: getMACDHistogramColor(d.histogram) })));
                macdSeries.setData(indicators.macd.map(d => ({ time: d.time as Time, value: d.macd })));
                signalSeries.setData(indicators.macd.map(d => ({ time: d.time as Time, value: d.signal })));
            }

        } catch (e) {
            console.error("MACD Update Error", e);
        }
    }, [indicators.macd, activeIndicators]);


    // 4. Live Update (Lightweight)
    useEffect(() => {
        if (!liveCandle || !mainChartRef.current || !mainSeriesRef.current) return;

        try {
            if (chartType === 'candlestick') {
                mainSeriesRef.current.update({ ...liveCandle, time: liveCandle.time as Time });
            } else {
                mainSeriesRef.current.update({ time: liveCandle.time as Time, value: liveCandle.close });
            }
        } catch (error) {
            // console.error("Live Update Error:", error);
        }

    }, [liveCandle, chartType]);

    // 5. Robust Resize Handling
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width } = entries[0].contentRect;

            if (mainChartRef.current) mainChartRef.current.applyOptions({ width });
            if (rsiChartRef.current) rsiChartRef.current.applyOptions({ width });
            if (macdChartRef.current) macdChartRef.current.applyOptions({ width });
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [activeIndicators]);

    // Return Stacked Layout
    return (
        <div ref={containerRef} className="w-full h-full flex flex-col space-y-1">
            {/* Main Chart */}
            <div ref={mainChartContainerRef} className="w-full flex-1 min-h-[400px]" />

            {/* Indicators */}
            {activeIndicators.includes('RSI') && (
                <div ref={rsiChartContainerRef} className="w-full h-[150px] border-t border-border" />
            )}
            {activeIndicators.includes('MACD') && (
                <div ref={macdChartContainerRef} className="w-full h-[150px] border-t border-border" />
            )}
        </div>
    );
};
