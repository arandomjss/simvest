// Shared Sector Mapping Logic
// Aligned with NSE sector classifications for NIFTY 50 constituents
// Last audited: April 2026 — verified against NSE/Wikipedia

export const SECTOR_MAP: Record<string, string> = {
    // --- IT ---
    'TCS':          'IT',
    'INFY':         'IT',
    'WIPRO':        'IT',
    'HCLTECH':      'IT',
    'TECHM':        'IT',

    // --- Banking ---
    'HDFCBANK':     'Banking',
    'ICICIBANK':    'Banking',
    'SBIN':         'Banking',
    'KOTAKBANK':    'Banking',
    'AXISBANK':     'Banking',

    // --- Financial Services ---
    'BAJFINANCE':   'Financial Services',
    'BAJAJFINSV':   'Financial Services',
    'SHRIRAMFIN':   'Financial Services',
    'JIOFIN':       'Financial Services',

    // --- Insurance ---
    'HDFCLIFE':     'Insurance',
    'SBILIFE':      'Insurance',

    // --- FMCG ---
    'ITC':          'FMCG',
    'HINDUNILVR':   'FMCG',
    'NESTLEIND':    'FMCG',
    'TATACONSUM':   'FMCG',

    // --- Automobile ---
    'MARUTI':       'Automobile',
    'M&M':          'Automobile',
    'BAJAJ-AUTO':   'Automobile',
    'EICHERMOT':    'Automobile',
    'TMPV':         'Automobile',

    // --- Pharma ---
    'SUNPHARMA':    'Pharma',
    'DRREDDY':      'Pharma',
    'CIPLA':        'Pharma',

    // --- Healthcare ---
    'APOLLOHOSP':   'Healthcare',
    'MAXHEALTH':    'Healthcare',

    // --- Energy ---
    'RELIANCE':     'Energy',
    'ONGC':         'Energy',
    'COALINDIA':    'Energy',

    // --- Telecom ---
    'BHARTIARTL':   'Telecom',

    // --- Infrastructure ---
    'LT':           'Infrastructure',
    'ADANIPORTS':   'Infrastructure',

    // --- Consumer ---
    'TITAN':        'Consumer',
    'ASIANPAINT':   'Consumer',

    // --- Retail ---
    'TRENT':        'Retail',

    // --- Materials ---
    'ULTRACEMCO':   'Materials',
    'TATASTEEL':    'Materials',
    'HINDALCO':     'Materials',
    'JSWSTEEL':     'Materials',
    'GRASIM':       'Materials',

    // --- Power ---
    'NTPC':         'Power',
    'POWERGRID':    'Power',

    // --- Capital Goods ---
    'BEL':          'Capital Goods',

    // --- Airlines ---
    'INDIGO':       'Airlines',

    // --- Consumer Services ---
    'ETERNAL':      'Consumer Services',

    // --- Diversified ---
    'ADANIENT':     'Diversified',
};

export const SECTOR_COLORS: Record<string, string> = {
    'IT':                 '#2196f3',
    'Banking':            '#4caf50',
    'Financial Services': '#66bb6a',
    'Insurance':          '#26a69a',
    'Energy':             '#ff9800',
    'FMCG':               '#9c27b0',
    'Automobile':         '#f44336',
    'Pharma':             '#00bcd4',
    'Healthcare':         '#00acc1',
    'Telecom':            '#e91e63',
    'Infrastructure':     '#607d8b',
    'Consumer':           '#7b1fa2',
    'Retail':             '#ab47bc',
    'Materials':          '#795548',
    'Power':              '#ffc107',
    'Capital Goods':      '#5c6bc0',
    'Airlines':           '#42a5f5',
    'Consumer Services':  '#ef5350',
    'Diversified':        '#3f51b5',
    'Others':             '#9e9e9e',
};

export const getSector = (symbol: string): string => SECTOR_MAP[symbol] || 'Others';
