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
 * Simple Linear Congruential Generator for seeded random numbers
 */
class SeededRNG {
    private seed: number;

    constructor(seedStr: string) {
        // Create a numeric hash from the string
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            const char = seedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        this.seed = Math.abs(hash);
    }

    // Returns a pseudo-random float between 0 and 1
    nextFloat(): number {
        const m = 0x80000000;
        const a = 1103515245;
        const c = 12345;

        this.seed = (a * this.seed + c) % m;
        return this.seed / (m - 1);
    }

    // Returns a pseudo-random integer between min and max (inclusive)
    nextRange(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

/**
 * Generate realistic mock historical OHLC data for a stock
 */
export const generateHistoricalData = (
    currentPrice: number,
    timeframe: Timeframe,
    seed: string = 'default'
): { ohlc: OHLCData[]; volume: VolumeData[] } => {
    const rng = new SeededRNG(seed);
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    let numCandles: number;
    let candleInterval: number; // in seconds
    let volatilityMultiplier: number;

    // Determine number of candles, interval, and volatility scale based on timeframe
    switch (timeframe) {
        case '1D':
            numCandles = 78 * 5; // 5 days of 5-min candles to allow scrolling back
            candleInterval = 5 * 60; // 5 minutes
            volatilityMultiplier = 0.005; // 0.5% tight daily swing
            break;
        case '1W':
            numCandles = 65 * 4; // 4 weeks of 30-min candles
            candleInterval = 30 * 60; // 30 minutes
            volatilityMultiplier = 0.015; // 1.5% weekly scale
            break;
        case '1M':
            numCandles = 35 * 6; // 6 months of daily candles to scroll back into
            candleInterval = 24 * 60 * 60; // 1 day (24 hours)
            volatilityMultiplier = 0.05; // 5% monthly scale
            break;
        case '3M':
            numCandles = 90 * 4; // 1 year of daily candles
            candleInterval = 24 * 60 * 60; // 1 day
            volatilityMultiplier = 0.10; // 10% swing over 3 months
            break;
        case '1Y':
            numCandles = 150 * 5; // 5 years of history
            candleInterval = 2 * 24 * 60 * 60; // 2 days
            volatilityMultiplier = 0.25; // 25% price scale over a year
            break;
        default:
            numCandles = 60 * 4;
            candleInterval = 24 * 60 * 60;
            volatilityMultiplier = 0.05;
    }

    const ohlc: OHLCData[] = [];
    const volume: VolumeData[] = [];

    const changes: number[] = [];
    const volatility = currentPrice * volatilityMultiplier;

    for (let i = 0; i < numCandles; i++) {
        // Use RNG for everything
        const change = (rng.nextFloat() - 0.5) * volatility;
        changes.push(change);
    }

    // Construct the price series backwards from currentPrice
    let price = currentPrice;
    let time = now;

    for (let i = 0; i < numCandles; i++) {
        time -= candleInterval;

        // Skip weekends (0 = Sunday, 6 = Saturday)
        let date = new Date(time * 1000);
        while (date.getDay() === 0 || date.getDay() === 6) {
            time -= 24 * 60 * 60; // Subtract 1 full day
            date = new Date(time * 1000);
        }

        const change = changes[i]; // Use the generated changes
        const close = price;
        const open = price - change;

        // High/Low based on open/close
        const high = Math.max(open, close) + rng.nextFloat() * volatility * 0.4;
        const low = Math.min(open, close) - rng.nextFloat() * volatility * 0.4;

        // Volume
        const baseVolume = 100000;
        const volumeValue = baseVolume + rng.nextFloat() * baseVolume;
        const volumeColor = close >= open ? '#00d09c40' : '#eb5b3c40';

        ohlc.unshift({ // Prepend to array to keep chronological order (oldest first)
            time: Math.floor(time),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
        });

        volume.unshift({
            time: Math.floor(time),
            value: Math.floor(volumeValue),
            color: volumeColor,
        });

        price = open; // The open of this candle is the close of the previous one
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
