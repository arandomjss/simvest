import { useEffect, useRef } from 'react';
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    HistogramSeries,
    IChartApi,
    ISeriesApi,
    Time,
    ColorType,
    CrosshairMode,
    LogicalRange
} from 'lightweight-charts';
import { OHLCData, VolumeData } from '../services/historicalData';
import { IndicatorData, MACDData, BollingerBandsData, getMACDHistogramColor } from '../services/technicalIndicators';
import { colors } from '../styles/colors';

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
        rsi?: IndicatorData[];
        macd?: MACDData[];
        bollinger?: BollingerBandsData[];
    };
    activeIndicators?: string[];
    liveCandle?: OHLCData; // Typed strictly
}

export const StockChart = ({
    ohlcData,
    volumeData,
    chartType,
    indicators = {},
    activeIndicators = [],
    liveCandle
}: StockChartProps) => {
    // Contains Refs
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const volumeContainerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);

    // API Refs
    const mainChartRef = useRef<IChartApi | null>(null);
    const volumeChartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);

    // Series Refs
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    // Indicators Series Map
    const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line"> | ISeriesApi<"Histogram">>>(new Map());

    // --- Common Options ---
    const chartOptions = {
        layout: {
            background: { type: ColorType.Solid, color: colors.background.DEFAULT },
            textColor: colors.text.secondary
        },
        grid: {
            vertLines: { color: colors.border.DEFAULT },
            horzLines: { color: colors.border.DEFAULT }
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: {
            borderColor: colors.border.DEFAULT,
            timeVisible: true
        },
        rightPriceScale: {
            borderColor: colors.border.DEFAULT,
        },
        handleScale: {
            axisPressedMouseMove: true,
        },
        handleScroll: {
            vertTouchDrag: false,
        },
    };

    // --- 1. Initialization (Run Once) ---
    useEffect(() => {
        if (!mainContainerRef.current || !volumeContainerRef.current) return;

        // Cleanup previous
        const clean = () => {
            [mainChartRef, volumeChartRef, rsiChartRef, macdChartRef].forEach(r => {
                if (r.current) { r.current.remove(); r.current = null; }
            });
            indicatorSeriesRef.current.clear();
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
        clean();

        // Create Main Chart
        mainChartRef.current = createChart(mainContainerRef.current, {
            ...chartOptions,
            width: mainContainerRef.current.clientWidth || 600,
            height: mainContainerRef.current.clientHeight || 400,
        });

        // Create Volume Chart
        volumeChartRef.current = createChart(volumeContainerRef.current, {
            ...chartOptions,
            width: volumeContainerRef.current.clientWidth,
            height: 80, // Fixed small height
            timeScale: { visible: false }, // Hide time axis for volume to stack cleanly
        });

        // Setup Main Series placeholder (type/data set in update)
        // Setup Volume Series placeholder
        volumeSeriesRef.current = volumeChartRef.current.addSeries(HistogramSeries, {
            color: colors.primary.DEFAULT,
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Bind to the right price scale
        });
        volumeSeriesRef.current.priceScale().applyOptions({
            scaleMargins: { top: 0.1, bottom: 0 }, // Make volume take up 90% of its pane
        });

        // Resize Observer
        const resizeObserver = new ResizeObserver(() => {
            // Simple resize logic: width matches container
            // Height: Main fills flex space, others fixed
            if (mainContainerRef.current && mainChartRef.current) {
                const { width, height } = mainContainerRef.current.getBoundingClientRect();
                mainChartRef.current.applyOptions({ width, height });
            }
            [volumeChartRef, rsiChartRef, macdChartRef].forEach((chartRef, i) => {
                const container = [volumeContainerRef, rsiContainerRef, macdContainerRef][i].current;
                if (chartRef.current && container) {
                    chartRef.current.applyOptions({ width: container.clientWidth });
                }
            });
        });
        resizeObserver.observe(mainContainerRef.current);
        resizeObserver.observe(volumeContainerRef.current);

        // Sync Logic - Initial setup for main and volume
        // We'll re-subscribe in the next effect for dynamic panes
        if (mainChartRef.current && volumeChartRef.current) {
            mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) {
                    volumeChartRef.current?.timeScale().setVisibleLogicalRange(range);
                }
            });
            volumeChartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) {
                    mainChartRef.current?.timeScale().setVisibleLogicalRange(range);
                }
            });
        }

        return () => {
            resizeObserver.disconnect();
            clean();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- 2. Dynamic Pane Management (RSI/MACD) & Sync ---
    useEffect(() => {
        const chartsToObserve: HTMLDivElement[] = [];
        if (mainContainerRef.current) chartsToObserve.push(mainContainerRef.current);
        if (volumeContainerRef.current) chartsToObserve.push(volumeContainerRef.current);

        // Manage RSI
        if (activeIndicators.includes('RSI') && rsiContainerRef.current && !rsiChartRef.current) {
            rsiChartRef.current = createChart(rsiContainerRef.current, {
                ...chartOptions, width: rsiContainerRef.current.clientWidth, height: 130
            });
            chartsToObserve.push(rsiContainerRef.current);
        } else if (!activeIndicators.includes('RSI') && rsiChartRef.current) {
            rsiChartRef.current.remove();
            rsiChartRef.current = null;
            // Also remove any RSI series from the map
            indicatorSeriesRef.current.delete('RSI_LINE');
            indicatorSeriesRef.current.delete('RSI_70');
            indicatorSeriesRef.current.delete('RSI_30');
        }

        // Manage MACD
        if (activeIndicators.includes('MACD') && macdContainerRef.current && !macdChartRef.current) {
            macdChartRef.current = createChart(macdContainerRef.current, {
                ...chartOptions, width: macdContainerRef.current.clientWidth, height: 130
            });
            chartsToObserve.push(macdContainerRef.current);
        } else if (!activeIndicators.includes('MACD') && macdChartRef.current) {
            macdChartRef.current.remove();
            macdChartRef.current = null;
            // Also remove any MACD series from the map
            indicatorSeriesRef.current.delete('MACD_S');
            indicatorSeriesRef.current.delete('MACD_SIG');
            indicatorSeriesRef.current.delete('MACD_H');
        }

        // Re-Apply Sync whenever chart instances change
        const allCharts = [mainChartRef.current, volumeChartRef.current, rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];

        // Clear previous subscriptions to avoid duplicates
        // This is a bit of a hack as Lightweight Charts doesn't expose a way to get/clear all subscriptions easily.
        // For simplicity, we'll just re-subscribe, assuming the old ones will be garbage collected or overwritten.
        // A more robust solution would involve storing unsubscribe functions.

        // Leader-Follower Sync: Main chart drives all others
        const handleVisibleLogicalRangeChange = (range: LogicalRange | null) => {
            if (range) {
                // Determine which charts to update (all except main)
                // Note: allCharts includes mainChartRef.current, so we filter it out
                allCharts
                    .filter(c => c !== mainChartRef.current)
                    .forEach(c => c.timeScale().setVisibleLogicalRange(range));
            }
        };

        if (mainChartRef.current) {
            mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
        }

        return () => {
            if (mainChartRef.current) {
                mainChartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
            }
        };

    }, [activeIndicators]);


    // --- 3. Data Updates ---
    useEffect(() => {
        if (!mainChartRef.current || ohlcData.length === 0) return;

        // A. Main Series (Recreate if type changes, or update data)
        const isCandle = chartType === 'candlestick';
        const currentSeriesType = mainSeriesRef.current?.seriesType();

        if (!mainSeriesRef.current || (isCandle && currentSeriesType !== 'Candlestick') || (!isCandle && currentSeriesType !== 'Line')) {
            if (mainSeriesRef.current) {
                mainChartRef.current.removeSeries(mainSeriesRef.current);
            }
            mainSeriesRef.current = isCandle
                ? mainChartRef.current.addSeries(CandlestickSeries, {
                    upColor: colors.success.DEFAULT, downColor: colors.danger.DEFAULT,
                    borderUpColor: colors.success.DEFAULT, borderDownColor: colors.danger.DEFAULT,
                    wickUpColor: colors.success.DEFAULT, wickDownColor: colors.danger.DEFAULT
                })
                : mainChartRef.current.addSeries(LineSeries, { color: colors.primary.DEFAULT, lineWidth: 2 });
        }

        if (mainSeriesRef.current) {
            if (isCandle) {
                mainSeriesRef.current.setData(ohlcData.map(d => ({ ...d, time: d.time as Time })));
            } else {
                (mainSeriesRef.current as ISeriesApi<"Line">).setData(ohlcData.map(d => ({ time: d.time as Time, value: d.close })));
            }
            // Ensure chart fits data
            requestAnimationFrame(() => {
                mainChartRef.current?.timeScale().fitContent();
            });
        }


        // B. Volume
        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(volumeData.map(d => ({
                ...d,
                time: d.time as Time,
                color: d.color // Use pre-calculated color from data
            })));
        }

        // C. Indicators
        // Helper to manage series map
        const updateSeries = (key: string, data: Record<string, unknown>[] | undefined, type: 'Line' | 'Histogram', options: Record<string, unknown>, chart: IChartApi | null) => {
            if (!chart) return;

            let series = indicatorSeriesRef.current.get(key);
            const isActive = activeIndicators.includes(key.split('_')[0]) || // e.g., 'SMA20'
                (key.startsWith('BB_') && activeIndicators.includes('BB')) ||
                (key.startsWith('RSI_') && activeIndicators.includes('RSI')) ||
                (key.startsWith('MACD_') && activeIndicators.includes('MACD'));

            if (isActive && data && data.length > 0) {
                if (!series) {
                    series = type === 'Line' ? chart.addSeries(LineSeries, options) : chart.addSeries(HistogramSeries, options);
                    indicatorSeriesRef.current.set(key, series);
                }
                series.setData(data.map(d => ({ ...d, time: d.time as Time })));
            } else if (series) {
                chart.removeSeries(series);
                indicatorSeriesRef.current.delete(key);
            }
        };

        // Main Overlays
        updateSeries('SMA20', indicators.sma20, 'Line', { color: '#ff9800', lineWidth: 1, title: 'SMA 20' }, mainChartRef.current);
        updateSeries('SMA50', indicators.sma50, 'Line', { color: '#9c27b0', lineWidth: 1, title: 'SMA 50' }, mainChartRef.current);
        updateSeries('SMA200', indicators.sma200, 'Line', { color: '#2196f3', lineWidth: 1, title: 'SMA 200' }, mainChartRef.current);
        updateSeries('EMA12', indicators.ema12, 'Line', { color: '#4caf50', lineWidth: 1, title: 'EMA 12' }, mainChartRef.current);
        updateSeries('EMA26', indicators.ema26, 'Line', { color: '#f44336', lineWidth: 1, title: 'EMA 26' }, mainChartRef.current);

        // Bollinger Bands
        if (activeIndicators.includes('BB') && indicators.bollinger?.length && mainChartRef.current) {
            updateSeries('BB_UP', indicators.bollinger.map((b: BollingerBandsData) => ({ time: b.time, value: b.upper })), 'Line', { color: '#2962ff', lineWidth: 1, title: 'BB Upper' }, mainChartRef.current);
            updateSeries('BB_MID', indicators.bollinger.map((b: BollingerBandsData) => ({ time: b.time, value: b.middle })), 'Line', { color: '#2962ff', lineWidth: 1, lineStyle: 2, title: 'BB Basis' }, mainChartRef.current);
            updateSeries('BB_LO', indicators.bollinger.map((b: BollingerBandsData) => ({ time: b.time, value: b.lower })), 'Line', { color: '#2962ff', lineWidth: 1, title: 'BB Lower' }, mainChartRef.current);
        } else {
            // Ensure BB series are removed if indicator is not active
            ['BB_UP', 'BB_MID', 'BB_LO'].forEach(key => {
                const series = indicatorSeriesRef.current.get(key);
                if (series && mainChartRef.current) {
                    mainChartRef.current.removeSeries(series);
                    indicatorSeriesRef.current.delete(key);
                }
            });
        }

        // RSI
        if (activeIndicators.includes('RSI') && rsiChartRef.current && indicators.rsi?.length) {
            let rsiS = indicatorSeriesRef.current.get('RSI_LINE') as ISeriesApi<"Line">;
            if (!rsiS) {
                rsiS = rsiChartRef.current.addSeries(LineSeries, { color: '#7e57c2', lineWidth: 2, title: 'RSI 14' });
                indicatorSeriesRef.current.set('RSI_LINE', rsiS);

                // Add 70/30 lines
                const l70 = rsiChartRef.current.addSeries(LineSeries, { color: '#ef5350', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, priceLineVisible: false });
                indicatorSeriesRef.current.set('RSI_70', l70);
                const l30 = rsiChartRef.current.addSeries(LineSeries, { color: '#26a69a', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, priceLineVisible: false });
                indicatorSeriesRef.current.set('RSI_30', l30);
            }
            const rsiData = indicators.rsi.map(d => ({ time: d.time as Time, value: d.value }));
            rsiS.setData(rsiData);
            // Update 70/30 lines with the same time range
            const dataRange = indicators.rsi.map(d => ({ time: d.time as Time }));
            (indicatorSeriesRef.current.get('RSI_70') as ISeriesApi<"Line">)?.setData(dataRange.map(d => ({ ...d, value: 70 })));
            (indicatorSeriesRef.current.get('RSI_30') as ISeriesApi<"Line">)?.setData(dataRange.map(d => ({ ...d, value: 30 })));
        } else if (!activeIndicators.includes('RSI') && rsiChartRef.current) {
            // Handled by the dynamic pane management effect
        }

        // MACD
        if (activeIndicators.includes('MACD') && macdChartRef.current && indicators.macd?.length) {
            let mS = indicatorSeriesRef.current.get('MACD_S') as ISeriesApi<"Line">;
            let sigS = indicatorSeriesRef.current.get('MACD_SIG') as ISeriesApi<"Line">;
            let hS = indicatorSeriesRef.current.get('MACD_H') as ISeriesApi<"Histogram">;

            if (!mS) {
                mS = macdChartRef.current.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2, title: 'MACD' });
                sigS = macdChartRef.current.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 2, title: 'Signal' });
                hS = macdChartRef.current.addSeries(HistogramSeries, { title: 'Histogram' });
                indicatorSeriesRef.current.set('MACD_S', mS);
                indicatorSeriesRef.current.set('MACD_SIG', sigS);
                indicatorSeriesRef.current.set('MACD_H', hS);
            }
            mS.setData(indicators.macd.map((d: MACDData) => ({ time: d.time as Time, value: d.macd })));
            sigS.setData(indicators.macd.map((d: MACDData) => ({ time: d.time as Time, value: d.signal })));
            hS.setData(indicators.macd.map((d: MACDData) => ({ time: d.time as Time, value: d.histogram, color: getMACDHistogramColor(d.histogram) })));
        } else if (!activeIndicators.includes('MACD') && macdChartRef.current) {
            // Handled by the dynamic pane management effect
        }

    }, [ohlcData, indicators, chartType, activeIndicators]); // Dependency on Data only

    // --- 4. Live Updates ---
    useEffect(() => {
        if (mainSeriesRef.current && liveCandle) {
            mainSeriesRef.current.update({
                ...liveCandle,
                time: liveCandle.time as Time
            });
        }
    }, [liveCandle]);

    return (
        <div className="w-full h-full flex flex-col bg-background">
            {/* Main Chart */}
            <div className="flex-1 min-h-0 relative border-b border-border">
                <div ref={mainContainerRef} className="absolute inset-0" />
            </div>

            {/* Volume Pane (Fixed Height) */}
            <div className="h-[80px] w-full relative border-b border-border">
                <div ref={volumeContainerRef} className="absolute inset-0" />
                <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10">VOL</span>
            </div>

            {/* Indicators */}
            {activeIndicators.includes('RSI') && (
                <div className="h-[130px] w-full relative border-b border-border animate-in slide-in-from-bottom-2 fade-in">
                    <div ref={rsiContainerRef} className="absolute inset-0" />
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10">RSI (14)</span>
                </div>
            )}
            {activeIndicators.includes('MACD') && (
                <div className="h-[130px] w-full relative border-b border-border animate-in slide-in-from-bottom-2 fade-in">
                    <div ref={macdContainerRef} className="absolute inset-0" />
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10">MACD (12, 26, 9)</span>
                </div>
            )}
        </div>
    );
};
