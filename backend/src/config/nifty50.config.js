// NIFTY 50 constituent stocks
// This list should be updated periodically as NIFTY 50 composition changes

export const NIFTY_50_SYMBOLS = [
    'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
    'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
    'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY',
    'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
    'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
    'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT',
    'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC',
    'POWERGRID', 'RELIANCE', 'SBILIFE', 'SHRIRAMFIN', 'SBIN',
    'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATASTEEL',
    'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO'
];

// Cache for instrument keys (will be populated from Upstox API)
let instrumentKeysCache = new Map();

/**
 * Fetch and cache NIFTY 50 instrument keys from Upstox
 */
export async function loadNifty50Instruments() {
    try {
        // const response = await fetch('https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz');

        // Note: In production, you'd need to decompress the gzip response
        // For now, we'll use the uncompressed JSON endpoint (if available)
        // or manually decompress using a library like pako

        console.log('⚠️  Note: Instrument download requires gzip decompression');
        console.log('📝 Using hardcoded instrument keys for NIFTY 50 stocks');

        // Hardcoded instrument keys for major NIFTY 50 stocks
        // In production, fetch and parse from Upstox API
        const hardcodedInstruments = {
            'RELIANCE': 'NSE_EQ|INE002A01018',
            'TCS': 'NSE_EQ|INE467B01029',
            'HDFCBANK': 'NSE_EQ|INE040A01034',
            'INFY': 'NSE_EQ|INE009A01021',
            'ICICIBANK': 'NSE_EQ|INE090A01021',
            'HINDUNILVR': 'NSE_EQ|INE030A01027',
            'ITC': 'NSE_EQ|INE154A01025',
            'SBIN': 'NSE_EQ|INE062A01020',
            'BHARTIARTL': 'NSE_EQ|INE397D01024',
            'KOTAKBANK': 'NSE_EQ|INE237A01028',
            'LT': 'NSE_EQ|INE018A01030',
            'AXISBANK': 'NSE_EQ|INE238A01034',
            'ASIANPAINT': 'NSE_EQ|INE021A01026',
            'MARUTI': 'NSE_EQ|INE585B01010',
            'TITAN': 'NSE_EQ|INE280A01028',
            'SUNPHARMA': 'NSE_EQ|INE044A01036',
            'ULTRACEMCO': 'NSE_EQ|INE481G01011',
            'NESTLEIND': 'NSE_EQ|INE239A01016',
            'BAJFINANCE': 'NSE_EQ|INE296A01024',
            'M&M': 'NSE_EQ|INE101A01026',
            'HCLTECH': 'NSE_EQ|INE860A01027',
            'WIPRO': 'NSE_EQ|INE075A01022',
            'ADANIENT': 'NSE_EQ|INE423A01024',
            'ADANIPORTS': 'NSE_EQ|INE742F01042',
            'POWERGRID': 'NSE_EQ|INE752E01010',
            'NTPC': 'NSE_EQ|INE733E01010',
            'ONGC': 'NSE_EQ|INE213A01029',
            'JSWSTEEL': 'NSE_EQ|INE019A01038',
            'TATASTEEL': 'NSE_EQ|INE081A01020',
            'COALINDIA': 'NSE_EQ|INE522F01014',
            'GRASIM': 'NSE_EQ|INE047A01021',
            'HINDALCO': 'NSE_EQ|INE038A01020',
            'BRITANNIA': 'NSE_EQ|INE216A01030',
            'DIVISLAB': 'NSE_EQ|INE361B01024',
            'DRREDDY': 'NSE_EQ|INE089A01023',
            'CIPLA': 'NSE_EQ|INE059A01026',
            'APOLLOHOSP': 'NSE_EQ|INE437A01024',
            'HEROMOTOCO': 'NSE_EQ|INE158A01026',
            'EICHERMOT': 'NSE_EQ|INE066A01021',
            'BAJAJ-AUTO': 'NSE_EQ|INE917I01010',
            'BAJAJFINSV': 'NSE_EQ|INE918I01018',
            'BPCL': 'NSE_EQ|INE029A01011',
            'INDUSINDBK': 'NSE_EQ|INE095A01012',
            'TECHM': 'NSE_EQ|INE669C01036',
            'TATACONSUM': 'NSE_EQ|INE192A01025',
            'UPL': 'NSE_EQ|INE628A01036',
            'SBILIFE': 'NSE_EQ|INE123W01016',
            'HDFCLIFE': 'NSE_EQ|INE795G01014',
            'SHRIRAMFIN': 'NSE_EQ|INE721A01013'
        };

        instrumentKeysCache = new Map(Object.entries(hardcodedInstruments));
        console.log(`✅ Loaded ${instrumentKeysCache.size} NIFTY 50 instrument keys`);

        return instrumentKeysCache;
    } catch (error) {
        console.error('❌ Error loading NIFTY 50 instruments:', error.message);
        throw error;
    }
}

/**
 * Get instrument key for a symbol
 */
export function getInstrumentKey(symbol) {
    return instrumentKeysCache.get(symbol);
}

/**
 * Get all instrument keys
 */
export function getAllInstrumentKeys() {
    return Array.from(instrumentKeysCache.values());
}

/**
 * Get symbol from instrument key
 */
export function getSymbolFromKey(instrumentKey) {
    for (const [symbol, key] of instrumentKeysCache.entries()) {
        if (key === instrumentKey) {
            return symbol;
        }
    }
    return null;
}

export default {
    NIFTY_50_SYMBOLS,
    loadNifty50Instruments,
    getInstrumentKey,
    getAllInstrumentKeys,
    getSymbolFromKey
};
