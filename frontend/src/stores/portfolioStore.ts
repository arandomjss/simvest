import { create } from 'zustand';
import { apiService } from '../services/api';
import type { Portfolio, Order } from '../types';

interface PortfolioState {
    portfolio: Portfolio | null;
    orders: Order[];
    isPortfolioLoading: boolean;  // BUG-016: was a single isLoading shared by both fetch operations
    isOrdersLoading: boolean;
    pricesLoading: boolean;
    error: string | null;

    fetchPortfolio: () => Promise<void>;
    fetchOrders: (limit?: number, offset?: number) => Promise<void>;
    fetchLivePrices: () => Promise<void>;
    executeTrade: (symbol: string, instrumentKey: string, type: 'BUY' | 'SELL', quantity: number, orderType?: 'MARKET' | 'LIMIT', limitPrice?: number, strategy?: string, notes?: string) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    updatePortfolioWithPrices: (prices: Map<string, number>) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    portfolio: null,
    orders: [],
    isPortfolioLoading: false,
    isOrdersLoading: false,
    pricesLoading: false,
    error: null,

    fetchPortfolio: async () => {
        try {
            set({ isPortfolioLoading: true, error: null });
            const portfolio = await apiService.getPortfolio();
            set({ portfolio, isPortfolioLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch portfolio', isPortfolioLoading: false });
        }
    },

    fetchOrders: async (limit = 50, offset = 0) => {
        try {
            set({ isOrdersLoading: true, error: null });
            const orders = (await apiService.getOrderHistory(limit, offset)) || [];
            set({ orders, isOrdersLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch orders', isOrdersLoading: false });
        }
    },

    // Fetch live Yahoo Finance prices for current holdings and recompute P&L.
    // BUG-002 fix: Only update holdings and derived P&L fields. Do not touch cashBalance or
    // other portfolio fields — this prevents REST price refresh from racing with WebSocket prices.
    fetchLivePrices: async () => {
        const { portfolio } = get();
        if (!portfolio || portfolio.holdings.length === 0) return;
        set({ pricesLoading: true });
        try {
            const symbols = portfolio.holdings.map(h => h.symbol);
            const priceMap = await apiService.getLivePrices(symbols);

            // Re-read portfolio from store (could have changed while awaiting)
            const currentPortfolio = get().portfolio;
            if (!currentPortfolio) return;

            // Dynamically import marketStore to avoid circular dependency issues
            const { useMarketStore } = await import('./marketStore');
            const wsPrices = useMarketStore.getState().prices;

            const updatedHoldings = currentPortfolio.holdings.map(h => {
                const q = priceMap[h.symbol];
                
                // BUG-003 fix: Prevent REST data from clobbering fresh WebSocket ticks.
                // We use the WS price if available, falling back to Yahoo Finance, then to the last known price.
                const currentPrice = wsPrices.get(h.instrumentKey) || (q && q.price) || h.currentPrice || h.avgPrice;
                
                const pnl = (currentPrice - h.avgPrice) * h.quantity;
                const pnlPercent = h.avgPrice > 0 ? ((currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
                
                // Preserve Yahoo finance change stats if WS hasn't provided them yet
                const change = q?.change || h.change;
                const changePercent = q?.changePercent || h.changePercent;

                return { ...h, currentPrice, pnl, pnlPercent, change, changePercent };
            });

            const totalValue = updatedHoldings.reduce((s, h) => s + ((h.currentPrice || h.avgPrice) * h.quantity), 0);
            const totalInvestment = updatedHoldings.reduce((s, h) => s + (h.avgPrice * h.quantity), 0);
            const totalPnL = totalValue - totalInvestment;
            const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

            set({
                pricesLoading: false,
                portfolio: {
                    ...currentPortfolio,
                    holdings: updatedHoldings,
                    // BUG-004 fix: totalValue = equities only (cashBalance added by UI at render time)
                    totalValue,
                    totalInvestment,
                    totalPnL,
                    totalPnLPercent,
                },
            });
        } catch (err) {
            set({ pricesLoading: false });
        }
    },

    executeTrade: async (symbol, instrumentKey, type, quantity, orderType = 'MARKET', limitPrice?, strategy?, notes?) => {
        try {
            set({ isPortfolioLoading: true, error: null });
            await apiService.executeTrade(symbol, instrumentKey, type, quantity, orderType, limitPrice, strategy, notes);
            await get().fetchPortfolio();
            await get().fetchOrders();
            set({ isPortfolioLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to execute trade', isPortfolioLoading: false });
            throw error;
        }
    },

    cancelOrder: async (orderId: string) => {
        try {
            set({ isOrdersLoading: true, error: null });
            await apiService.cancelOrder(orderId);
            await get().fetchPortfolio();
            await get().fetchOrders();
            set({ isOrdersLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to cancel order', isOrdersLoading: false });
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
