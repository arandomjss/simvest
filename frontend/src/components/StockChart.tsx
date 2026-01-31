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
import { IndicatorData } from '../services/technicalIndicators';

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
    const mainChartContainerRef = useRef<HTMLDivElement>(null);
    const mainChartRef = useRef<IChartApi | null>(null);

    const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesRefs = useRef<{ [key: string]: ISeriesApi<"Line"> }>({});

    // 1. Initialize
    useEffect(() => {
        if (!mainChartContainerRef.current) return;

        // Cleanup existing chart
        if (mainChartRef.current) {
            try { mainChartRef.current.remove(); } catch (e) { console.warn("Cleanup error", e); }
        }

        const mainChart = createChart(mainChartContainerRef.current, {
            width: mainChartContainerRef.current.clientWidth,
            height: 500,
            layout: { background: { color: '#ffffff' }, textColor: '#424242' },
            grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
            timeScale: { timeVisible: true, secondsVisible: false },
        });
        mainChartRef.current = mainChart;

        const handleResize = () => {
            if (mainChartContainerRef.current && mainChartRef.current) {
                mainChartRef.current.applyOptions({ width: mainChartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mainChartRef.current) {
                try { mainChartRef.current.remove(); } catch (e) { }
            }
            mainChartRef.current = null;

            // Cleanup refs
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
            indicatorSeriesRefs.current = {};
        };
    }, []);

    // 2. Series Setup
    useEffect(() => {
        if (!mainChartRef.current) return;

        try {
            if (mainSeriesRef.current) {
                try { mainChartRef.current.removeSeries(mainSeriesRef.current); } catch (e) { }
                mainSeriesRef.current = null;
            }

            if (chartType === 'candlestick') {
                mainSeriesRef.current = mainChartRef.current.addSeries(CandlestickSeries, {
                    upColor: '#00d09c', downColor: '#eb5b3c',
                    borderUpColor: '#00d09c', borderDownColor: '#eb5b3c',
                    wickUpColor: '#00d09c', wickDownColor: '#eb5b3c',
                });
            } else {
                mainSeriesRef.current = mainChartRef.current.addSeries(LineSeries, {
                    color: '#387ed1', lineWidth: 2,
                });
            }

            if (!volumeSeriesRef.current) {
                const volSeries = mainChartRef.current.addSeries(HistogramSeries, {
                    color: '#26a69a',
                    priceFormat: { type: 'volume' },
                    priceScaleId: '',
                });
                volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
                volumeSeriesRef.current = volSeries;
            }
        } catch (error) {
            console.error("Series Setup Error:", error);
        }
    }, [chartType, mainChartRef.current]);

    // 3. Data Update (Full)
    useEffect(() => {
        if (!mainChartRef.current) return;

        try {
            // Update Main Series
            if (mainSeriesRef.current) {
                if (chartType === 'candlestick') {
                    mainSeriesRef.current.setData(ohlcData.map(d => ({ ...d, time: d.time as Time })));
                } else {
                    mainSeriesRef.current.setData(ohlcData.map(d => ({ time: d.time as Time, value: d.close })));
                }
            }

            // Update Volume
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.setData(volumeData.map(d => ({ ...d, time: d.time as Time })));
            }

            // Update Indicators
            Object.values(indicatorSeriesRefs.current).forEach(s => {
                try { mainChartRef.current?.removeSeries(s); } catch (e) { }
            });
            indicatorSeriesRefs.current = {};

            const addInd = (key: string, data: IndicatorData[] | undefined, color: string, title?: string) => {
                if (activeIndicators.includes(key) && data && data.length > 0 && mainChartRef.current) {
                    try {
                        const s = mainChartRef.current.addSeries(LineSeries, { color, lineWidth: 1, title: title || key });
                        s.setData(data.map(d => ({ ...d, time: d.time as Time })));
                        indicatorSeriesRefs.current[key] = s;
                    } catch (e) {
                        console.error(`Error adding indicator ${key}:`, e);
                    }
                }
            };

            addInd('SMA20', indicators.sma20, '#ff9800', 'SMA 20');
            addInd('SMA50', indicators.sma50, '#9c27b0', 'SMA 50');
            addInd('SMA200', indicators.sma200, '#2196f3', 'SMA 200');
            addInd('EMA12', indicators.ema12, '#4caf50', 'EMA 12');
            addInd('EMA26', indicators.ema26, '#f44336', 'EMA 26');

        } catch (error) {
            console.error("Chart Data Update Error:", error);
        }

    }, [ohlcData, volumeData, indicators, activeIndicators, chartType]);

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
            console.error("Live Update Error:", error);
        }

    }, [liveCandle, chartType]);

    return (
        <div className="w-full h-full">
            <div ref={mainChartContainerRef} className="w-full h-[500px]" />
        </div>
    );
};
