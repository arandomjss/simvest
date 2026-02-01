export interface User {
    id: string;
    email: string;
}

export interface Stock {
    symbol: string;
    name?: string; // Added optional name
    instrumentKey: string;
    ltp?: number;
    change?: number;
    changePercent?: number;
    volume?: number;
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
}

export interface Order {
    id: string;
    user_id: string;
    symbol: string;
    instrument_key: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    execution_price: number;
    total_amount: number;
    status: string;
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
