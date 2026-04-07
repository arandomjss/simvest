export interface User {
    id: string;
    email: string;
}

export interface Stock {
    symbol: string;
    name?: string; // Added optional name
    sector?: string; // Mapped from backend API
    instrumentKey: string;
    ltp?: number;
    price?: number; // Added for compatibility with Yahoo Finance response
    change?: number;
    changePercent?: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    previousClose?: number;
    marketCap?: number;
    lastUpdated?: number;
}

export interface PriceUpdate {
    symbol: string;
    instrumentKey: string;
    ltp: number;
    change?: number;
    changePercent?: number;
    timestamp: number;
}

export interface Holding {
    symbol: string;
    instrumentKey: string;
    quantity: number;
    avgPrice: number;
    currentPrice?: number;
    pnl?: number;
    pnlPercent?: number;
    change?: number;
    changePercent?: number;
}

export interface Order {
    id: string;
    user_id: string;
    symbol: string;
    instrument_key: string;
    type: 'BUY' | 'SELL';
    order_type?: 'MARKET' | 'LIMIT';
    quantity: number;
    execution_price: number;
    total_amount: number;
    status: string;
    strategy?: string;
    notes?: string;
    created_at: string;
}

export interface Portfolio {
    totalValue: number;
    totalInvestment: number;
    totalPnL: number;
    totalPnLPercent: number;
    holdings: Holding[];
    cashBalance: number;
}
