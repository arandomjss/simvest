import { OHLCData } from './historicalData';

export interface IndicatorData {
    time: number;
    value: number;
}

export interface MACDData {
    time: number;
    macd: number;
    signal: number;
    histogram: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export const calculateSMA = (data: OHLCData[], period: number): IndicatorData[] => {
    const result: IndicatorData[] = [];

    if (data.length < period) return result;

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        const average = sum / period;

        result.push({
            time: data[i].time,
            value: parseFloat(average.toFixed(2)),
        });
    }

    return result.map(item => ({
        ...item,
        value: isFinite(item.value) ? item.value : 0
    }));
};

/**
 * Calculate Exponential Moving Average (EMA)
 */
export const calculateEMA = (data: OHLCData[], period: number): IndicatorData[] => {
    const result: IndicatorData[] = [];
    if (data.length < period) return result;
    const multiplier = 2 / (period + 1);

    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i].close;
    }
    let ema = sum / period;

    result.push({
        time: data[period - 1].time,
        value: parseFloat(ema.toFixed(2)),
    });

    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
        ema = (data[i].close - ema) * multiplier + ema;
        result.push({
            time: data[i].time,
            value: parseFloat(ema.toFixed(2)),
        });
    }

    return result.map(item => ({
        ...item,
        value: isFinite(item.value) ? item.value : 0
    }));
};

/**
 * Calculate Relative Strength Index (RSI)
 */
export const calculateRSI = (data: OHLCData[], period: number = 14): IndicatorData[] => {
    const result: IndicatorData[] = [];

    if (data.length < period + 1) return result;

    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) {
            avgGain += change;
        } else {
            avgLoss += Math.abs(change);
        }
    }

    avgGain /= period;
    avgLoss /= period;

    // Calculate RSI for first point
    let rs = 0;
    if (avgLoss === 0) {
        rs = avgGain === 0 ? 0 : Infinity;
    } else {
        rs = avgGain / avgLoss;
    }

    let rsi = 100 - (100 / (1 + rs));
    if (isNaN(rsi)) rsi = 0;

    result.push({
        time: data[period].time,
        value: parseFloat(rsi.toFixed(2)),
    });

    // Calculate RSI for remaining points using smoothed averages
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        let rs = 0;
        if (avgLoss === 0) {
            rs = avgGain === 0 ? 0 : Infinity;
        } else {
            rs = avgGain / avgLoss;
        }

        let rsi = 100 - (100 / (1 + rs));
        if (isNaN(rsi)) rsi = 0; // Fallback

        result.push({
            time: data[i].time,
            value: parseFloat(rsi.toFixed(2)),
        });
    }

    return result.map(item => ({
        ...item,
        value: isFinite(item.value) ? item.value : 0
    }));
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export const calculateMACD = (data: OHLCData[]): MACDData[] => {
    const result: MACDData[] = [];

    // Calculate EMA(12) and EMA(26)
    if (data.length < 26) return result; // MACD needs at least 26 points

    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);

    // Calculate MACD line (EMA12 - EMA26)
    const macdLine: IndicatorData[] = [];
    const startIndex = 26 - 1; // Start from where EMA26 begins

    for (let i = 0; i < ema12.length; i++) {
        const ema12Index = i + (12 - 1);
        const ema26Index = i;

        if (ema26Index < ema26.length) {
            const macdValue = ema12[ema12Index].value - ema26[ema26Index].value;
            macdLine.push({
                time: ema26[ema26Index].time,
                value: macdValue,
            });
        }
    }

    // Calculate Signal line (EMA9 of MACD line)
    const signalLine = calculateEMA(
        macdLine.map(d => ({
            time: d.time,
            open: d.value,
            high: d.value,
            low: d.value,
            close: d.value,
        })),
        9
    );

    // Calculate histogram (MACD - Signal)
    for (let i = 0; i < signalLine.length; i++) {
        const macdIndex = i + 8; // Offset for signal line calculation
        if (macdIndex < macdLine.length) {
            const histogram = macdLine[macdIndex].value - signalLine[i].value;

            result.push({
                time: signalLine[i].time,
                macd: parseFloat(macdLine[macdIndex].value.toFixed(4)),
                signal: parseFloat(signalLine[i].value.toFixed(4)),
                histogram: parseFloat(histogram.toFixed(4)),
            });
        }
    }

    return result.map(item => ({
        time: item.time,
        macd: isFinite(item.macd) ? item.macd : 0,
        signal: isFinite(item.signal) ? item.signal : 0,
        histogram: isFinite(item.histogram) ? item.histogram : 0
    }));
};

/**
 * Get color for MACD histogram
 */
export const getMACDHistogramColor = (value: number): string => {
    return value >= 0 ? '#00d09c80' : '#eb5b3c80'; // Semi-transparent green/red
};

export interface BollingerBandsData {
    time: number;
    upper: number;
    middle: number;
    lower: number;
}

/**
 * Calculate Bollinger Bands
 * Formula: Middle = SMA(20), Upper = Middle + 2*StdDev, Lower = Middle - 2*StdDev
 */
export const calculateBollingerBands = (data: OHLCData[], period: number = 20, multiplier: number = 2): BollingerBandsData[] => {
    const result: BollingerBandsData[] = [];

    // Need enough data
    if (data.length < period) return result;

    for (let i = period - 1; i < data.length; i++) {
        // 1. Calculate SMA (Middle Band)
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        const middle = sum / period;

        // 2. Calculate Standard Deviation
        let varianceSum = 0;
        for (let j = 0; j < period; j++) {
            varianceSum += Math.pow(data[i - j].close - middle, 2);
        }
        const stdDev = Math.sqrt(varianceSum / period);

        // 3. Calculate Bands
        const upper = middle + (multiplier * stdDev);
        const lower = middle - (multiplier * stdDev);

        result.push({
            time: data[i].time,
            upper: parseFloat(upper.toFixed(2)),
            middle: parseFloat(middle.toFixed(2)),
            lower: parseFloat(lower.toFixed(2))
        });
    }

    return result.map(item => ({
        time: item.time,
        upper: isFinite(item.upper) ? item.upper : 0,
        middle: isFinite(item.middle) ? item.middle : 0,
        lower: isFinite(item.lower) ? item.lower : 0
    }));
};
