// NIFTY 50 constituent stocks
// This list should be updated periodically as NIFTY 50 composition changes

// Last verified: April 2026 (Wikipedia / NSE Indices)
// Recent changes:
//   Sept 2024: BEL added (replaced DIVISLAB), TRENT added (replaced LTIM)
//   Mar  2025: ETERNAL added (replaced BRITANNIA), JIOFIN added (replaced BPCL)
//   Sept 2025: INDIGO added (replaced HEROMOTOCO), MAXHEALTH added (replaced INDUSINDBK)
//   Oct  2025: TMPV added (Tata Motors PV demerger, replaced TATAMOTORS)
export const NIFTY_50_SYMBOLS = [
    'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
    'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BEL', 'BHARTIARTL',
    'CIPLA', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'ETERNAL',
    'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HINDALCO',
    'HINDUNILVR', 'ICICIBANK', 'INDIGO', 'INFY', 'ITC',
    'JIOFIN', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M',
    'MARUTI', 'MAXHEALTH', 'NESTLEIND', 'NTPC', 'ONGC',
    'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SHRIRAMFIN',
    'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATASTEEL', 'TECHM',
    'TITAN', 'TMPV', 'TRENT', 'ULTRACEMCO', 'WIPRO'
];

// Cache for instrument keys (will be populated from Upstox API)
let instrumentKeysCache = new Map();
let reverseKeyCache = new Map(); // instrumentKey → symbol (O(1) lookup)

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
            // Banking
            'HDFCBANK': 'NSE_EQ|INE040A01034',
            'ICICIBANK': 'NSE_EQ|INE090A01021',
            'SBIN': 'NSE_EQ|INE062A01020',
            'KOTAKBANK': 'NSE_EQ|INE237A01028',
            'AXISBANK': 'NSE_EQ|INE238A01034',
            // Financial Services
            'BAJFINANCE': 'NSE_EQ|INE296A01024',
            'BAJAJFINSV': 'NSE_EQ|INE918I01018',
            'SHRIRAMFIN': 'NSE_EQ|INE721A01013',
            'JIOFIN': 'NSE_EQ|INE545U01014',
            // Insurance
            'HDFCLIFE': 'NSE_EQ|INE795G01014',
            'SBILIFE': 'NSE_EQ|INE123W01016',
            // IT
            'TCS': 'NSE_EQ|INE467B01029',
            'INFY': 'NSE_EQ|INE009A01021',
            'WIPRO': 'NSE_EQ|INE075A01022',
            'HCLTECH': 'NSE_EQ|INE860A01027',
            'TECHM': 'NSE_EQ|INE669C01036',
            // FMCG
            'HINDUNILVR': 'NSE_EQ|INE030A01027',
            'ITC': 'NSE_EQ|INE154A01025',
            'NESTLEIND': 'NSE_EQ|INE239A01016',
            'TATACONSUM': 'NSE_EQ|INE192A01025',
            // Automobile
            'MARUTI': 'NSE_EQ|INE585B01010',
            'M&M': 'NSE_EQ|INE101A01026',
            'BAJAJ-AUTO': 'NSE_EQ|INE917I01010',
            'EICHERMOT': 'NSE_EQ|INE066A01021',
            'TMPV': 'NSE_EQ|INE155A01022',
            // Pharma & Healthcare
            'SUNPHARMA': 'NSE_EQ|INE044A01036',
            'DRREDDY': 'NSE_EQ|INE089A01023',
            'CIPLA': 'NSE_EQ|INE059A01026',
            'APOLLOHOSP': 'NSE_EQ|INE437A01024',
            'MAXHEALTH': 'NSE_EQ|INE027H01010',
            // Energy
            'RELIANCE': 'NSE_EQ|INE002A01018',
            'ONGC': 'NSE_EQ|INE213A01029',
            'COALINDIA': 'NSE_EQ|INE522F01014',
            // Power
            'NTPC': 'NSE_EQ|INE733E01010',
            'POWERGRID': 'NSE_EQ|INE752E01010',
            // Telecom
            'BHARTIARTL': 'NSE_EQ|INE397D01024',
            // Infrastructure
            'LT': 'NSE_EQ|INE018A01030',
            'ADANIPORTS': 'NSE_EQ|INE742F01042',
            // Materials & Metals
            'TATASTEEL': 'NSE_EQ|INE081A01020',
            'JSWSTEEL': 'NSE_EQ|INE019A01038',
            'HINDALCO': 'NSE_EQ|INE038A01020',
            'GRASIM': 'NSE_EQ|INE047A01021',
            'ULTRACEMCO': 'NSE_EQ|INE481G01011',
            // Consumer
            'TITAN': 'NSE_EQ|INE280A01028',
            'ASIANPAINT': 'NSE_EQ|INE021A01026',
            'TRENT': 'NSE_EQ|INE849A01020',
            // Capital Goods
            'BEL': 'NSE_EQ|INE263A01024',
            // Consumer Services
            'ETERNAL': 'NSE_EQ|INE758T01015',
            'INDIGO': 'NSE_EQ|INE646L01027',
            // Diversified
            'ADANIENT': 'NSE_EQ|INE423A01024',
        };

        instrumentKeysCache = new Map(Object.entries(hardcodedInstruments));
        // Build reverse lookup for O(1) symbol resolution on every price tick
        reverseKeyCache = new Map(
            Object.entries(hardcodedInstruments).map(([symbol, key]) => [key, symbol])
        );
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
    // O(1) reverse lookup
    const cached = reverseKeyCache.get(instrumentKey);
    if (cached) return cached;

    // Fallback for ad-hoc keys like index symbols (e.g., ^NSEI) — not valid for trading
    if (instrumentKey && instrumentKey.includes('|')) {
        return instrumentKey.split('|')[1];
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
