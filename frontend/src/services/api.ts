import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Always fetches the fresh, auto-refreshed token from the Supabase SDK.
// This is safer than reading a stale key from localStorage manually.
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch {
        // If we can't get a session, proceed without a token — the server will 401
    }
    return config;
});

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Catches session expiry (401) and rate limiting (429) globally so individual
// API calls don't need their own handling for these infrastructure-level errors.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Session expired — sign out cleanly and redirect to login
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');

            // Lazy-import toast to avoid a circular dependency at module init time
            const { default: toast } = await import('react-hot-toast');
            toast.error('Your session has expired. Please sign in again.', { duration: 5000 });

            // Redirect after a brief moment so the toast is visible
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else if (status === 429) {
            const { default: toast } = await import('react-hot-toast');
            toast.error('Too many requests. Please wait a moment before trying again.', { duration: 6000 });
        }

        return Promise.reject(error);
    }
);

export const apiService = {
    // Trading endpoints
    async executeTrade(symbol: string, instrumentKey: string, type: 'BUY' | 'SELL', quantity: number, orderType: 'MARKET' | 'LIMIT' = 'MARKET', limitPrice?: number, strategy?: string, notes?: string) {
        const response = await api.post('/api/trade/execute', {
            symbol,
            instrumentKey,
            type,
            quantity,
            orderType,
            limitPrice,
            strategy,
            notes
        });
        return response.data;
    },

    async cancelOrder(orderId: string) {
        const response = await api.delete(`/api/trade/orders/${orderId}`);
        return response.data;
    },

    async getPortfolio() {
        const response = await api.get('/api/trade/portfolio');
        const data = response.data.portfolio;

        // Map snake_case to camelCase for frontend
        // BUG-011 fix: Ensure data.holdings is always an array to prevent .length or .map crashes in the UI
        if (data) {
            data.holdings = (data.holdings || []).map((h: { avg_price?: number; instrument_key?: string; [key: string]: unknown }) => ({
                ...h,
                avgPrice: h.avg_price,
                instrumentKey: h.instrument_key,
                // Keep originals just in case, but ensure camelCase exists
            }));
        }
        return data;
    },

    async getOrderHistory(limit = 50, offset = 0) {
        const response = await api.get('/api/trade/orders/history', {
            params: { limit, offset },
        });
        return response.data.orders;
    },

    async exportOrdersXml() {
        const response = await api.get('/api/trade/orders/history/xml', {
            responseType: 'blob', // Important for file download
        });
        return response.data;
    },

    // Market endpoints
    async getInstruments() {
        const response = await api.get('/api/market/instruments');
        return response.data.instruments;
    },

    getHistoricalData: async (instrumentKey: string, interval: string = '1d', period: string = '1mo') => {
        const response = await api.get(`/api/market/historical/${instrumentKey}`, {
            params: { interval, period }
        });
        return response.data.candles;
    },

    getCompanyProfile: async (symbol: string) => {
        const response = await api.get(`/api/yahoo/profile/${symbol}`);
        return response.data.data;
    },

    getCompanyNews: async (symbol: string) => {
        const response = await api.get(`/api/yahoo/news/${symbol}`);
        return response.data.data;
    },

    getIndices: async () => {
        const response = await api.get('/api/market/indices');
        return response.data.indices;
    },

    // Batch-fetch live quotes for a list of symbols (e.g. portfolio holdings)
    getLivePrices: async (symbols: string[]): Promise<Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number; previousClose: number }>> => {
        const response = await api.post('/api/yahoo/quotes', { symbols });
        const quotes: Array<{ symbol: string; price?: number; change?: number; changePercent?: number; high?: number; low?: number; open?: number; previousClose?: number }> = response.data.data || [];
        const map: Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number; previousClose: number }> = {};
        quotes.forEach((q) => {
            map[q.symbol] = {
                price:         q.price         || 0,
                change:        q.change        || 0,
                changePercent: q.changePercent || 0,
                high:          q.high          || 0,
                low:           q.low           || 0,
                open:          q.open          || 0,
                previousClose: q.previousClose || 0,
            };
        });
        return map;
    },

    async getMarketSignals(limit = 20) {
        const response = await api.get('/api/market/signals', {
            params: { limit },
        });
        return response.data.signals;
    },

    // Advisor Intelligence
    async getDeepAnalysis(symbol: string) {
        const response = await api.get(`/api/advisor/analyze/${symbol}`);
        return response.data.data;
    },
};

export default api;
