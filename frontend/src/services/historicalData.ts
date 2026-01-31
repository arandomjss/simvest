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
    // We want the chart to end exactly at currentPrice.
    // However, generating backwards is tricky with random walks if we want a specific 'shape'.
    // A better approach for deterministic charts ending at X:
    // Generate a forward path from 0 to N using the seed.
    // Calculate the cumulative change.
    // Offset the entire series so the last point equals currentPrice.

    const changes: number[] = [];
    const volatility = currentPrice * 0.02; // 2% volatility

    for (let i = 0; i < numCandles; i++) {
        // Use RNG for everything
        const change = (rng.nextFloat() - 0.5) * volatility;
        changes.push(change);
    }

    // Construct the price series backwards from currentPrice
    let price = currentPrice;

    for (let i = 0; i < numCandles; i++) {
        const time = now - i * candleInterval;

        // We go backwards, so the 'change' we generated for step i is inverted
        // effectively: previous_close + change = current_close
        // so: previous_close = current_close - change

        const change = changes[i]; // Use the generated changes
        const close = price;
        const open = price - change;

        // High/Low based on open/close
        const high = Math.max(open, close) + rng.nextFloat() * volatility * 0.5;
        const low = Math.min(open, close) - rng.nextFloat() * volatility * 0.5;

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
