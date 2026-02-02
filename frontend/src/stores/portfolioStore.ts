import { create } from 'zustand';
import { apiService } from '../services/api';
import type { Portfolio, Order } from '../types';

interface PortfolioState {
    portfolio: Portfolio | null;
    orders: Order[];
    isLoading: boolean;
    error: string | null;

    fetchPortfolio: () => Promise<void>;
    fetchOrders: (limit?: number, offset?: number) => Promise<void>;
    executeTrade: (symbol: string, instrumentKey: string, type: 'BUY' | 'SELL', quantity: number, orderType?: 'MARKET' | 'LIMIT', limitPrice?: number) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    updatePortfolioWithPrices: (prices: Map<string, number>) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    portfolio: null,
    orders: [],
    isLoading: false,
    error: null,

    fetchPortfolio: async () => {
        try {
            set({ isLoading: true, error: null });
            const portfolio = await apiService.getPortfolio();
            set({ portfolio, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch portfolio',
                isLoading: false,
            });
        }
    },

    fetchOrders: async (limit = 50, offset = 0) => {
        try {
            set({ isLoading: true, error: null });
            const orders = await apiService.getOrderHistory(limit, offset);
            set({ orders, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch orders',
                isLoading: false,
            });
        }
    },

    executeTrade: async (symbol: string, instrumentKey: string, type: 'BUY' | 'SELL', quantity: number, orderType: 'MARKET' | 'LIMIT' = 'MARKET', limitPrice?: number) => {
        try {
            set({ isLoading: true, error: null });
            await apiService.executeTrade(symbol, instrumentKey, type, quantity, orderType, limitPrice);

            // Refresh portfolio and orders after trade
            await get().fetchPortfolio();
            await get().fetchOrders();

            set({ isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to execute trade',
                isLoading: false,
            });
            throw error;
        }
    },

    cancelOrder: async (orderId: string) => {
        try {
            set({ isLoading: true, error: null });
            await apiService.cancelOrder(orderId);

            // Refresh data
            await get().fetchPortfolio();
            await get().fetchOrders();

            set({ isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to cancel order',
                isLoading: false,
            });
            throw error;
        }
    },

    updatePortfolioWithPrices: (prices: Map<string, number>) => {
        const { portfolio } = get();
        if (!portfolio) return;

        const updatedHoldings = portfolio.holdings.map((holding) => {
            const currentPrice = prices.get(holding.instrumentKey);
            if (!currentPrice) return holding;

            const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
            const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

            return {
                ...holding,
                currentPrice,
                pnl,
                pnlPercent,
            };
        });

        const totalValue = updatedHoldings.reduce(
            (sum, h) => {
                const price = Number(h.currentPrice || h.avgPrice) || 0;
                const qty = Number(h.quantity) || 0;
                return sum + (price * qty);
            },
            0
        );
        const totalInvestment = updatedHoldings.reduce(
            (sum, h) => {
                const price = Number(h.avgPrice) || 0;
                const qty = Number(h.quantity) || 0;
                return sum + (price * Math.abs(qty));
            },
            0
        );
        const netCostBasis = updatedHoldings.reduce((sum, h) => sum + (Number(h.avgPrice || 0) * Number(h.quantity || 0)), 0);
        const totalPnL = totalValue - netCostBasis;

        const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

        set({
            portfolio: {
                ...portfolio,
                holdings: updatedHoldings,
                totalValue,
                totalInvestment,
                totalPnL,
                totalPnLPercent,
            },
        });
    },
}));
