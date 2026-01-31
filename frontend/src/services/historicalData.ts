export interface OHLCData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface VolumeData {
    time: number;
    value: number;
    color: string;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y';

/**
 * Generate realistic mock historical OHLC data for a stock
 */
export const generateHistoricalData = (
    currentPrice: number,
    timeframe: Timeframe
): { ohlc: OHLCData[]; volume: VolumeData[] } => {
    const now = Date.now() / 1000; // Unix timestamp in seconds
    let numCandles: number;
    let candleInterval: number; // in seconds

    // Determine number of candles and interval based on timeframe
    switch (timeframe) {
        case '1D':
            numCandles = 78; // 6.5 hours * 12 (5-min candles)
            candleInterval = 5 * 60; // 5 minutes
            break;
        case '1W':
            numCandles = 65; // 5 days * 13 (30-min candles)
            candleInterval = 30 * 60; // 30 minutes
            break;
        case '1M':
            numCandles = 22; // ~22 trading days
            candleInterval = 24 * 60 * 60; // 1 day
            break;
        case '3M':
            numCandles = 65; // ~65 trading days
            candleInterval = 24 * 60 * 60; // 1 day
            break;
        case '1Y':
            numCandles = 52; // 52 weeks
            candleInterval = 7 * 24 * 60 * 60; // 1 week
            break;
        default:
            numCandles = 22;
            candleInterval = 24 * 60 * 60;
    }

    const ohlc: OHLCData[] = [];
    const volume: VolumeData[] = [];

    // Start from current price and work backwards
    let price = currentPrice;
    const volatility = currentPrice * 0.02; // 2% volatility

    for (let i = numCandles - 1; i >= 0; i--) {
        const time = now - i * candleInterval;

        // Generate random price movement
        const change = (Math.random() - 0.5) * volatility;
        const open = price;
        const close = price + change;

        // Ensure high is highest and low is lowest
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        // Generate volume (random but realistic)
        const baseVolume = 100000;
        const volumeValue = baseVolume + Math.random() * baseVolume;
        const volumeColor = close >= open ? '#00d09c40' : '#eb5b3c40'; // Semi-transparent green/red

        ohlc.push({
            time: Math.floor(time),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
        });

        volume.push({
            time: Math.floor(time),
            value: Math.floor(volumeValue),
            color: volumeColor,
        });

        // Update price for next candle
        price = close;
    }

    return { ohlc, volume };
};

/**
 * Convert OHLC data to line chart data (using close prices)
 */
export const ohlcToLineData = (ohlc: OHLCData[]) => {
    return ohlc.map((candle) => ({
        time: candle.time,
        value: candle.close,
    }));
};
