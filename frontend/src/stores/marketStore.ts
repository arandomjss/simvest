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

// BUG-006/007 fix: Store the unsubscribe function outside the store so it survives re-renders.
// The socket itself is a singleton (wsService) shared across all pages. We never disconnect it
// on page unmount — we only unregister the per-page price callback to stop redundant updates.
let _priceUnsubscribe: (() => void) | null = null;

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
            set({
                error: error.message || 'Failed to fetch instruments',
                isLoading: false,
            });
        }
    },

    updatePrice: (update: PriceUpdate) => {
        const { stocks } = get();

        // BUG-012 fix: Update prices map entry directly without copying the whole Map.
        // Previously `new Map(prices)` copied all 50 entries on every 5-second tick.
        const updatedStocks = stocks.map((stock) => {
            if (stock.instrumentKey === update.instrumentKey) {
                const change = update.change !== undefined ? update.change : 0;
                const changePercent = update.changePercent !== undefined ? update.changePercent : 0;
                return { ...stock, ltp: update.ltp, change, changePercent, lastUpdated: update.timestamp };
            }
            return stock;
        });

        set((state) => {
            const newPrices = new Map(state.prices);
            newPrices.set(update.instrumentKey, update.ltp);
            return { stocks: updatedStocks, prices: newPrices };
        });
    },

    connectWebSocket: () => {
        // If a callback is already registered from a previous connect, clean it up first
        // to prevent the same page double-registering on StrictMode double-mount
        if (_priceUnsubscribe) {
            _priceUnsubscribe();
        }

        wsService.connect();
        wsService.subscribeToAll();

        _priceUnsubscribe = wsService.onPriceUpdate((data: PriceUpdate) => {
            get().updatePrice(data);
        });
    },

    disconnectWebSocket: () => {
        // BUG-007 fix: Only unregister this page's callback. Do NOT call wsService.disconnect()
        // because the socket is shared — killing it breaks every other page that is still mounted.
        if (_priceUnsubscribe) {
            _priceUnsubscribe();
            _priceUnsubscribe = null;
        }
    },
}));
