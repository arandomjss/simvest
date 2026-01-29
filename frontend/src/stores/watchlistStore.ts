import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
    watchlist: string[]; // Array of instrumentKeys
    addToWatchlist: (instrumentKey: string) => void;
    removeFromWatchlist: (instrumentKey: string) => void;
    isInWatchlist: (instrumentKey: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlist: [],

            addToWatchlist: (instrumentKey: string) => {
                const { watchlist } = get();
                if (!watchlist.includes(instrumentKey)) {
                    set({ watchlist: [...watchlist, instrumentKey] });
                }
            },

            removeFromWatchlist: (instrumentKey: string) => {
                const { watchlist } = get();
                set({ watchlist: watchlist.filter((key) => key !== instrumentKey) });
            },

            isInWatchlist: (instrumentKey: string) => {
                return get().watchlist.includes(instrumentKey);
            },
        }),
        {
            name: 'simvest-watchlist',
        }
    )
);
