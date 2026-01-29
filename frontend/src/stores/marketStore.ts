import { create } from 'zustand';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { Stock, PriceUpdate } from '../types';

interface MarketState {
    stocks: Stock[];
    prices: Map<string, number>;
    isLoading: boolean;
    error: string | null;

    fetchInstruments: () => Promise<void>;
    updatePrice: (update: PriceUpdate) => void;
    connectWebSocket: () => void;
    disconnectWebSocket: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    stocks: [],
    prices: new Map(),
    isLoading: false,
    error: null,

    fetchInstruments: async () => {
        try {
            set({ isLoading: true, error: null });
            const instruments = await apiService.getInstruments();

            const stocks: Stock[] = instruments.map((inst: any) => ({
                symbol: inst.symbol,
                instrumentKey: inst.instrumentKey,
            }));

            set({ stocks, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch instruments',
                isLoading: false,
            });
        }
    },

    updatePrice: (update: PriceUpdate) => {
        const { stocks, prices } = get();

        // Update prices map
        const newPrices = new Map(prices);
        const oldPrice = newPrices.get(update.instrumentKey);
        newPrices.set(update.instrumentKey, update.ltp);

        // Update stocks with price info
        const updatedStocks = stocks.map((stock) => {
            if (stock.instrumentKey === update.instrumentKey) {
                const change = oldPrice ? update.ltp - oldPrice : 0;
                const changePercent = oldPrice ? (change / oldPrice) * 100 : 0;

                return {
                    ...stock,
                    ltp: update.ltp,
                    change,
                    changePercent,
                };
            }
            return stock;
        });

        set({ stocks: updatedStocks, prices: newPrices });
    },

    connectWebSocket: () => {
        wsService.connect();
        wsService.subscribeToAll();

        wsService.onPriceUpdate((data: PriceUpdate) => {
            get().updatePrice(data);
        });
    },

    disconnectWebSocket: () => {
        wsService.disconnect();
    },
}));
