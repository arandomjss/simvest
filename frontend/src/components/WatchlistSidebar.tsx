import { useState } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { useWatchlistStore } from '../stores/watchlistStore';

interface WatchlistSidebarProps {
    onTrade: (stock: any, type: 'BUY' | 'SELL') => void;
}

export const WatchlistSidebar = ({ onTrade }: WatchlistSidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { stocks } = useMarketStore();
    const { watchlist, removeFromWatchlist } = useWatchlistStore();

    const watchlistStocks = stocks.filter((stock) =>
        watchlist.includes(stock.instrumentKey)
    );

    const formatPrice = (price?: number) => {
        return price ? `₹${price.toFixed(2)}` : '—';
    };

    const formatChange = (change?: number, changePercent?: number) => {
        if (!change || !changePercent) return { text: '—', isPositive: true };
        const sign = change >= 0 ? '+' : '';
        return {
            text: `${sign}${changePercent.toFixed(2)}%`,
            isPositive: change >= 0,
        };
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-surface border-r border-border flex flex-col items-center py-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="text-text-secondary hover:text-primary transition"
                    title="Expand Watchlist"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className="w-64 bg-surface border-r border-border flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Watchlist</h3>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="text-text-secondary hover:text-primary transition"
                    title="Collapse"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Watchlist Items */}
            <div className="flex-1 overflow-y-auto">
                {watchlistStocks.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-xs text-text-secondary">No stocks in watchlist</p>
                        <p className="text-xs text-text-muted mt-1">Click ⭐ to add stocks</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-light">
                        {watchlistStocks.map((stock) => {
                            const change = formatChange(stock.change, stock.changePercent);
                            return (
                                <div
                                    key={stock.instrumentKey}
                                    className="p-3 hover:bg-surface-hover transition group"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-1">
                                                <span className="text-sm font-medium text-text-primary">
                                                    {stock.symbol}
                                                </span>
                                                <button
                                                    onClick={() => removeFromWatchlist(stock.instrumentKey)}
                                                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition"
                                                    title="Remove from watchlist"
                                                >
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="text-xs text-text-primary font-medium mt-0.5">
                                                {formatPrice(stock.ltp)}
                                            </div>
                                        </div>
                                        <div className={`text-xs font-medium ${change.isPositive ? 'text-profit' : 'text-loss'}`}>
                                            {change.text}
                                        </div>
                                    </div>

                                    {/* Quick Trade Buttons */}
                                    <div className="flex space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => onTrade(stock, 'BUY')}
                                            className="flex-1 px-2 py-1 text-xs font-medium text-success hover:bg-success/10 rounded transition"
                                        >
                                            B
                                        </button>
                                        <button
                                            onClick={() => onTrade(stock, 'SELL')}
                                            className="flex-1 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 rounded transition"
                                        >
                                            S
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
