// Shared Sector Mapping Logic

export const SECTOR_MAP: Record<string, string> = {
    'RELIANCE': 'Energy',
    'TCS': 'Technology',
    'INFY': 'Technology',
    'WIPRO': 'Technology',
    'HDFCBANK': 'Finance',
    'ICICIBANK': 'Finance',
    'SBIN': 'Finance',
    'KOTAKBANK': 'Finance',
    'AXISBANK': 'Finance',
    'ITC': 'FMCG',
    'HINDUNILVR': 'FMCG',
    'BRITANNIA': 'FMCG',
    'BAJFINANCE': 'Finance',
    'MARUTI': 'Automobile',
    'TATAMOTORS': 'Automobile',
    'M&M': 'Automobile',
    'SUNPHARMA': 'Pharma',
    'DRREDDY': 'Pharma',
    'CIPLA': 'Pharma',
    'ONGC': 'Energy',
    'COALINDIA': 'Energy',
};

export const SECTOR_COLORS: Record<string, string> = {
    'Technology': '#2196f3',
    'Finance': '#4caf50',
    'Energy': '#ff9800',
    'FMCG': '#9c27b0',
    'Automobile': '#f44336',
    'Pharma': '#00bcd4',
    'Others': '#9e9e9e',
};

export const getSector = (symbol: string): string => SECTOR_MAP[symbol] || 'Others';
