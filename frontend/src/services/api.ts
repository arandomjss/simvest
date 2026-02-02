import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const apiService = {
    // Trading endpoints
    async executeTrade(symbol: string, instrumentKey: string, type: 'BUY' | 'SELL', quantity: number, orderType: 'MARKET' | 'LIMIT' = 'MARKET', limitPrice?: number) {
        const response = await api.post('/api/trade/execute', {
            symbol,
            instrumentKey,
            type,
            quantity,
            orderType,
            limitPrice
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
        if (data && data.holdings) {
            data.holdings = data.holdings.map((h: any) => ({
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

    getIndices: async () => {
        const response = await api.get('/api/market/indices');
        return response.data.indices;
    },

    async getMarketSignals(limit = 20) {
        const response = await api.get('/api/market/signals', {
            params: { limit },
        });
        return response.data.signals;
    },
};

export default api;
