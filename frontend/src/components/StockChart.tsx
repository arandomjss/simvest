import { useEffect, useRef, useState } from 'react';
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    AreaSeries,
    BarSeries,
    BaselineSeries,
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

// Custom Renko algorithm to construct price bricks from standard OHLC candles
export function calculateRenko(ohlcData: OHLCData[]): OHLCData[] {
    if (ohlcData.length === 0) return [];
    
    // Brick size is 1% of the initial close
    const brickSize = Math.max(0.1, (ohlcData[0]?.close || 100) * 0.01);
    
    const renkoBricks: OHLCData[] = [];
    let currentBrickTop = ohlcData[0].close;
    let currentBrickBottom = ohlcData[0].close - brickSize;
    let lastTime = 0;
    
    ohlcData.forEach((candle) => {
        const timeVal = typeof candle.time === 'number' ? candle.time : parseInt(candle.time as any, 10);
        
        if (candle.close >= currentBrickTop + brickSize) {
            const numBricks = Math.floor((candle.close - currentBrickTop) / brickSize);
            for (let b = 0; b < numBricks; b++) {
                const openVal = currentBrickTop;
                const closeVal = currentBrickTop + brickSize;
                let brickTime = timeVal;
                if (brickTime <= lastTime) {
                    brickTime = lastTime + 1;
                }
                lastTime = brickTime;
                
                renkoBricks.push({
                    time: brickTime,
                    open: parseFloat(openVal.toFixed(2)),
                    high: parseFloat(closeVal.toFixed(2)),
                    low: parseFloat(openVal.toFixed(2)),
                    close: parseFloat(closeVal.toFixed(2))
                });
                currentBrickTop = closeVal;
                currentBrickBottom = openVal;
            }
        } else if (candle.close <= currentBrickBottom - brickSize) {
            const numBricks = Math.floor((currentBrickBottom - candle.close) / brickSize);
            for (let b = 0; b < numBricks; b++) {
                const openVal = currentBrickBottom;
                const closeVal = currentBrickBottom - brickSize;
                let brickTime = timeVal;
                if (brickTime <= lastTime) {
                    brickTime = lastTime + 1;
                }
                lastTime = brickTime;
                
                renkoBricks.push({
                    time: brickTime,
                    open: openVal,
                    high: openVal,
                    low: closeVal,
                    close: closeVal
                });
                currentBrickTop = openVal;
                currentBrickBottom = closeVal;
            }
        }
    });
    
    if (renkoBricks.length === 0) {
        renkoBricks.push({
            time: typeof ohlcData[0].time === 'number' ? ohlcData[0].time : parseInt(ohlcData[0].time as any, 10),
            open: ohlcData[0].open,
            high: ohlcData[0].high,
            low: ohlcData[0].low,
            close: ohlcData[0].close
        });
    }
    
    return renkoBricks;
}

// Custom Point & Figure algorithm to construct columns of rising (X) and falling (O) price boxes
export function calculatePointAndFigure(ohlcData: OHLCData[]): OHLCData[] {
    if (ohlcData.length === 0) return [];
    
    const boxSize = Math.max(0.15, (ohlcData[0]?.close || 100) * 0.015);
    const reversal = 3;
    
    const columns: Array<{ isUp: boolean; boxes: number[] }> = [];
    let currentIsUp = ohlcData[0].close >= ohlcData[0].open;
    let currentBoxes = [Math.floor(ohlcData[0].close / boxSize)];
    
    columns.push({ isUp: currentIsUp, boxes: currentBoxes });
    
    for (let i = 1; i < ohlcData.length; i++) {
        const candle = ohlcData[i];
        const lastCol = columns[columns.length - 1];
        const lastBox = lastCol.boxes[lastCol.boxes.length - 1];
        const currentBox = Math.floor(candle.close / boxSize);
        
        if (lastCol.isUp) {
            if (currentBox > lastBox) {
                for (let b = lastBox + 1; b <= currentBox; b++) {
                    lastCol.boxes.push(b);
                }
            } else if (currentBox <= lastBox - reversal) {
                const newBoxes = [];
                for (let b = lastBox - 1; b >= currentBox; b--) {
                    newBoxes.push(b);
                }
                columns.push({ isUp: false, boxes: newBoxes });
            }
        } else {
            if (currentBox < lastBox) {
                for (let b = lastBox - 1; b >= currentBox; b--) {
                    lastCol.boxes.push(b);
                }
            } else if (currentBox >= lastBox + reversal) {
                const newBoxes = [];
                for (let b = lastBox + 1; b <= currentBox; b++) {
                    newBoxes.push(b);
                }
                columns.push({ isUp: true, boxes: newBoxes });
            }
        }
    }
    
    const pfCandles: OHLCData[] = [];
    const baseTime = typeof ohlcData[0].time === 'number' ? ohlcData[0].time : parseInt(ohlcData[0].time as any, 10);
    
    columns.forEach((col, idx) => {
        if (col.boxes.length === 0) return;
        const lowBox = Math.min(...col.boxes);
        const highBox = Math.max(...col.boxes);
        
        const openVal = col.isUp ? lowBox * boxSize : highBox * boxSize;
        const closeVal = col.isUp ? highBox * boxSize : lowBox * boxSize;
        
        const candleTime = baseTime + idx * 86400; // Sequence daily intervals
        
        pfCandles.push({
            time: candleTime,
            open: parseFloat(openVal.toFixed(2)),
            high: parseFloat((highBox * boxSize).toFixed(2)),
            low: parseFloat((lowBox * boxSize).toFixed(2)),
            close: parseFloat(closeVal.toFixed(2))
        });
    });
    
    return pfCandles;
}

interface StockChartProps {
    ohlcData: OHLCData[];
    volumeData: VolumeData[];
    chartType: 'candlestick' | 'line' | 'area' | 'bar' | 'baseline' | 'renko' | 'pointAndFigure';
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
    timeframe?: string; // Optional timeframe prop for smart pre-zooming
}

export const StockChart = ({
    ohlcData,
    volumeData,
    chartType,
    indicators = {},
    activeIndicators = [],
    liveCandle,
    timeframe
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

    const [volumeHeight, setVolumeHeight] = useState(80);



    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = volumeHeight;

        // Apply global style overrides to prevent cursor flashing and text selection highlights
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(40, Math.min(250, startHeight - deltaY));
            setVolumeHeight(newHeight);
        };

        const handleMouseUp = () => {
            // Restore body defaults
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Series Refs
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area" | "Bar" | "Baseline"> | null>(null);
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
            height: volumeContainerRef.current.clientHeight || volumeHeight,
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

        return () => {
            resizeObserver.disconnect();
            clean();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync chart heights dynamically when volume height changes (loop-free)
    useEffect(() => {
        if (volumeChartRef.current && volumeContainerRef.current) {
            volumeChartRef.current.applyOptions({
                height: volumeHeight
            });
        }
        if (mainChartRef.current && mainContainerRef.current) {
            const { width, height } = mainContainerRef.current.getBoundingClientRect();
            mainChartRef.current.applyOptions({ width, height });
        }
    }, [volumeHeight]);

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

        // Sync lock to prevent recursive loops and blank charts
        let isSyncing = false;

        const unsubscribes = allCharts.map(chart => {
            const handleVisibleLogicalRangeChange = (range: LogicalRange | null) => {
                if (!range || isSyncing) return;
                isSyncing = true;

                allCharts.forEach(otherChart => {
                    if (otherChart !== chart) {
                        try {
                            otherChart.timeScale().setVisibleLogicalRange(range);
                        } catch (e) {
                            // Guard against lightweight chart edge case errors
                        }
                    }
                });

                isSyncing = false;
            };

            chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

            return () => {
                try {
                    chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
                } catch (e) {
                    // Ignore errors during unsubscription/unmounting
                }
            };
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [activeIndicators]);


    // --- 3. Data Updates ---
    useEffect(() => {
        if (!mainChartRef.current || ohlcData.length === 0) return;

        // A. Main Series (Recreate if type changes, or update data)
        let seriesConstructor: any;
        let seriesOptions = {};

        switch (chartType) {
            case 'candlestick':
                seriesConstructor = CandlestickSeries;
                seriesOptions = {
                    upColor: colors.success.DEFAULT, downColor: colors.danger.DEFAULT,
                    borderUpColor: colors.success.DEFAULT, borderDownColor: colors.danger.DEFAULT,
                    wickUpColor: colors.success.DEFAULT, wickDownColor: colors.danger.DEFAULT
                };
                break;
            case 'line':
                seriesConstructor = LineSeries;
                seriesOptions = { color: colors.primary.DEFAULT, lineWidth: 2 };
                break;
            case 'area':
                seriesConstructor = AreaSeries;
                seriesOptions = {
                    topColor: 'rgba(33, 150, 243, 0.3)',
                    bottomColor: 'rgba(33, 150, 243, 0.0)',
                    lineColor: '#2196f3',
                    lineWidth: 2
                };
                break;
            case 'bar':
                seriesConstructor = BarSeries;
                seriesOptions = {
                    upColor: colors.success.DEFAULT,
                    downColor: colors.danger.DEFAULT
                };
                break;
            case 'baseline': {
                const baseVal = ohlcData[Math.floor(ohlcData.length / 2)]?.close || ohlcData[0]?.close || 100;
                seriesConstructor = BaselineSeries;
                seriesOptions = {
                    baseValue: { type: 'price', price: baseVal },
                    topFillColor1: 'rgba(34, 197, 94, 0.4)', // Vibrant emerald green top
                    topFillColor2: 'rgba(34, 197, 94, 0.02)',
                    topLineColor: 'rgba(34, 197, 94, 1)',
                    bottomFillColor1: 'rgba(239, 68, 68, 0.02)',
                    bottomFillColor2: 'rgba(239, 68, 68, 0.4)', // Vibrant crimson red bottom
                    bottomLineColor: 'rgba(239, 68, 68, 1)',
                    lineWidth: 2
                };
                break;
            }
            case 'renko':
            case 'pointAndFigure':
                seriesConstructor = CandlestickSeries;
                seriesOptions = {
                    upColor: colors.success.DEFAULT, downColor: colors.danger.DEFAULT,
                    borderUpColor: colors.success.DEFAULT, borderDownColor: colors.danger.DEFAULT,
                    wickUpColor: colors.success.DEFAULT, wickDownColor: colors.danger.DEFAULT
                };
                break;
        }

        const expectedType = (chartType === 'candlestick' || chartType === 'renko' || chartType === 'pointAndFigure')
            ? 'Candlestick'
            : (chartType.charAt(0).toUpperCase() + chartType.slice(1));
        const currentSeriesType = mainSeriesRef.current?.seriesType();

        if (!mainSeriesRef.current || currentSeriesType !== expectedType) {
            if (mainSeriesRef.current) {
                mainChartRef.current.removeSeries(mainSeriesRef.current);
            }
            mainSeriesRef.current = mainChartRef.current.addSeries(seriesConstructor, seriesOptions);

            // Add dotted baseline indicator line
            if (chartType === 'baseline') {
                const baseVal = ohlcData[Math.floor(ohlcData.length / 2)]?.close || ohlcData[0]?.close || 100;
                mainSeriesRef.current.createPriceLine({
                    price: baseVal,
                    color: colors.text.secondary + 'B0', // Dotted gray
                    lineWidth: 1,
                    lineStyle: 2, // Dotted
                    axisLabelVisible: true,
                    title: 'Baseline Price',
                });
            }
        }

        if (mainSeriesRef.current) {
            let dataToSet = ohlcData;
            if (chartType === 'renko') {
                dataToSet = calculateRenko(ohlcData);
            } else if (chartType === 'pointAndFigure') {
                dataToSet = calculatePointAndFigure(ohlcData);
            }

            if (chartType === 'candlestick' || chartType === 'bar' || chartType === 'renko' || chartType === 'pointAndFigure') {
                mainSeriesRef.current.setData(dataToSet.map(d => ({ ...d, time: d.time as Time })));
            } else {
                mainSeriesRef.current.setData(dataToSet.map(d => ({ time: d.time as Time, value: d.close })));
            }
            // Ensure chart fits data or sets a pre-zoomed visible range for deep scrolling history
            requestAnimationFrame(() => {
                if (mainChartRef.current) {
                    const timeScale = mainChartRef.current.timeScale();
                    let count = 0;
                    if (timeframe === '1D') count = 78;      // 1 day of 5-min candles
                    else if (timeframe === '1W') count = 65; // 1 week of 30-min candles
                    else if (timeframe === '1M') count = 30; // 1 month of daily candles
                    else if (timeframe === '3M') count = 90; // 3 months of daily candles
                    else if (timeframe === '1Y') count = 52; // 1 year of weekly candles

                    if (count > 0 && ohlcData.length > count) {
                        timeScale.setVisibleLogicalRange({
                            from: ohlcData.length - count,
                            to: ohlcData.length - 1
                        });
                    } else {
                        timeScale.fitContent();
                    }
                }
            });
        }


        // B. Volume
        if (volumeSeriesRef.current) {
            let activeVolumeData = volumeData;
            if (chartType === 'renko') {
                const renko = calculateRenko(ohlcData);
                const rawVolMap = new Map<number, number>();
                volumeData.forEach(v => rawVolMap.set(v.time as number, v.value));
                
                activeVolumeData = renko.map(r => {
                    const rawVol = rawVolMap.get(r.time as number) || 100000;
                    return {
                        time: r.time,
                        value: rawVol,
                        color: r.close >= r.open ? '#00d09c40' : '#eb5b3c40'
                    };
                });
            } else if (chartType === 'pointAndFigure') {
                const pf = calculatePointAndFigure(ohlcData);
                activeVolumeData = pf.map(r => ({
                    time: r.time,
                    value: 100000,
                    color: r.close >= r.open ? '#00d09c40' : '#eb5b3c40'
                }));
            }

            volumeSeriesRef.current.setData(activeVolumeData.map(d => ({
                ...d,
                time: d.time as Time,
                color: d.color // Use pre-calculated color from data
            })));
        }

        // C. Indicators
        // Helper to manage series map
        const updateSeries = (key: string, data: any[] | undefined, type: 'Line' | 'Histogram', options: Record<string, unknown>, chart: IChartApi | null) => {
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
            if (chartType === 'candlestick' || chartType === 'bar') {
                mainSeriesRef.current.update({
                    ...liveCandle,
                    time: liveCandle.time as Time
                });
            } else {
                mainSeriesRef.current.update({
                    time: liveCandle.time as Time,
                    value: liveCandle.close
                });
            }
        }
    }, [liveCandle, chartType]);

    return (
        <div className="w-full h-full flex flex-col bg-background pb-4">
            {/* Main Chart */}
            <div className="flex-1 min-h-0 relative border-b border-border">
                <div ref={mainContainerRef} className="absolute inset-0" />
            </div>

            {/* Draggable Resizer Splitter for Volume */}
            <div
                onMouseDown={handleMouseDown}
                className="h-[6px] w-full bg-gray-100 dark:bg-slate-800/80 hover:bg-primary/50 cursor-ns-resize transition-colors flex items-center justify-center relative z-30 select-none group border-t border-b border-border/20"
                title="Drag to resize volume panel"
            >
                <div className="w-8 h-1 bg-gray-300 dark:bg-slate-600 rounded group-hover:bg-primary/80 transition-colors" />
            </div>

            {/* Volume Pane (Stateful Height) */}
            <div style={{ height: `${volumeHeight}px` }} className="w-full relative border-b border-border min-h-[40px] max-h-[250px]">
                <div ref={volumeContainerRef} className="absolute inset-0" />
                <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10 select-none">VOL</span>
            </div>

            {/* Indicators */}
            {activeIndicators.includes('RSI') && (
                <div className="h-[130px] w-full relative border-b border-border animate-in slide-in-from-bottom-2 fade-in">
                    <div ref={rsiContainerRef} className="absolute inset-0" />
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10 select-none">RSI (14)</span>
                </div>
            )}
            {activeIndicators.includes('MACD') && (
                <div className="h-[130px] w-full relative border-b border-border animate-in slide-in-from-bottom-2 fade-in">
                    <div ref={macdContainerRef} className="absolute inset-0" />
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-text-secondary z-10 select-none">MACD (12, 26, 9)</span>
                </div>
            )}
        </div>
    );
};
