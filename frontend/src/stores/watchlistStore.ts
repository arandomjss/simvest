import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Watchlist {
    id: string;
    name: string;
    items: string[];
}

interface WatchlistState {
    watchlists: Watchlist[];
    activeWatchlistId: string;

    // Actions
    createWatchlist: (name: string) => void;
    deleteWatchlist: (id: string) => void;
    renameWatchlist: (id: string, name: string) => void;
    setActiveWatchlist: (id: string) => void;

    addToWatchlist: (instrumentKey: string, watchlistId?: string) => void;
    removeFromWatchlist: (instrumentKey: string, watchlistId?: string) => void;
    isInWatchlist: (instrumentKey: string, watchlistId?: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlists: [{ id: 'default', name: 'My Watchlist', items: [] }],
            activeWatchlistId: 'default',

            createWatchlist: (name: string) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    watchlists: [...state.watchlists, { id, name, items: [] }],
                    activeWatchlistId: id,
                }));
            },

            deleteWatchlist: (id: string) => {
                set((state) => {
                    const newWatchlists = state.watchlists.filter((wl) => wl.id !== id);
                    if (newWatchlists.length === 0) {
                        return {
                            watchlists: [{ id: 'default', name: 'My Watchlist', items: [] }],
                            activeWatchlistId: 'default',
                        };
                    }
                    return {
                        watchlists: newWatchlists,
                        activeWatchlistId: state.activeWatchlistId === id ? newWatchlists[0].id : state.activeWatchlistId,
                    };
                });
            },

            renameWatchlist: (id: string, name: string) => {
                set((state) => ({
                    watchlists: state.watchlists.map((wl) => (wl.id === id ? { ...wl, name } : wl)),
                }));
            },

            setActiveWatchlist: (id: string) => {
                set({ activeWatchlistId: id });
            },

            addToWatchlist: (instrumentKey: string, watchlistId?: string) => {
                const state = get();
                const targetId = watchlistId || state.activeWatchlistId;
                set({
                    watchlists: state.watchlists.map((wl) =>
                        wl.id === targetId && !wl.items.includes(instrumentKey)
                            ? { ...wl, items: [...wl.items, instrumentKey] }
                            : wl
                    ),
                });
            },

            removeFromWatchlist: (instrumentKey: string, watchlistId?: string) => {
                const state = get();
                const targetId = watchlistId || state.activeWatchlistId;
                set({
                    watchlists: state.watchlists.map((wl) =>
                        wl.id === targetId
                            ? { ...wl, items: wl.items.filter((key) => key !== instrumentKey) }
                            : wl
                    ),
                });
            },

            isInWatchlist: (instrumentKey: string, watchlistId?: string) => {
                const state = get();
                const targetId = watchlistId || state.activeWatchlistId;
                const wl = state.watchlists.find((w) => w.id === targetId);
                return wl ? wl.items.includes(instrumentKey) : false;
            },
        }),
        {
            name: 'simvest-watchlist',
            merge: (persistedState: unknown, currentState) => {
                // BUG-022 fix: Validate persistedState instead of blindly merging 'any'
                // which could accept corrupt localStorage data and crash the app.
                if (!persistedState || typeof persistedState !== 'object') {
                    return currentState;
                }

                const state = persistedState as Partial<WatchlistState> & { watchlist?: string[] };

                // Migration path from old format ({ watchlist: string[] })
                if (state.watchlist && Array.isArray(state.watchlist) && !state.watchlists) {
                    return {
                        ...currentState,
                        watchlists: [{ id: 'default', name: 'My Watchlist', items: state.watchlist }],
                        activeWatchlistId: 'default'
                    };
                }
                
                // Ensure watchlists is an array if present
                if (state.watchlists && !Array.isArray(state.watchlists)) {
                     return currentState;
                }

                return { ...currentState, ...state };
            }
        }
    )
);
