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

            if (!instruments || instruments.length === 0) throw new Error("Empty instruments");

            const stocks: Stock[] = instruments.map((inst: any) => ({
                symbol: inst.symbol,
                name: inst.name || inst.companyName || inst.symbol,
                instrumentKey: inst.instrumentKey,
                sector: inst.sector,
                ltp: inst.price || 0,
                change: inst.change || 0,
                changePercent: inst.changePercent || 0,
                volume: inst.volume || 0,
                high: inst.high || 0,
                low: inst.low || 0,
                open: inst.open || 0,
                previousClose: inst.previousClose || 0,
                marketCap: inst.marketCap || 0
            }));

            set({ stocks, isLoading: false });
        } catch (error: any) {
            console.error("Failed to fetch instruments:", error);
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
        newPrices.set(update.instrumentKey, update.ltp);

        // Update stocks with price info
        const updatedStocks = stocks.map((stock) => {
            if (stock.instrumentKey === update.instrumentKey) {
                // Use backend values if available, otherwise fallback to local calculation
                // Always prioritize backend values for Day Change.
                // Fallback to 0 if missing, to avoid confusing tick-to-tick updates.
                const change = update.change !== undefined ? update.change : 0;
                const changePercent = update.changePercent !== undefined ? update.changePercent : 0;

                return {
                    ...stock,
                    ltp: update.ltp,
                    change,
                    changePercent,
                    lastUpdated: update.timestamp,
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
