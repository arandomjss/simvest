import { useMarketStore } from '../stores/marketStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistSidebarProps {
    onTrade: (stock: any, type: 'BUY' | 'SELL') => void;
}

export const WatchlistSidebar = ({ onTrade }: WatchlistSidebarProps) => {
    const { stocks } = useMarketStore();
    const { watchlists, activeWatchlistId, removeFromWatchlist } = useWatchlistStore();

    const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

    const watchlistStocks = stocks.filter((stock) =>
        activeWatchlist?.items.includes(stock.instrumentKey)
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

    return (
        <div className="w-72 bg-surface border-r border-border flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Watchlist</h3>
                <span className="text-xs text-text-secondary">{watchlistStocks.length} Items</span>
            </div>

            {/* Watchlist Items */}
            <div className="flex-1 overflow-y-auto">
                {watchlistStocks.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-xs text-text-secondary">No stocks in watchlist</p>
                        <p className="text-xs text-text-muted mt-1">Click the star icon to add stocks</p>
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
                                                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition p-1"
                                                    title="Remove from watchlist"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-xs text-text-primary font-medium mt-0.5">
                                                {formatPrice(stock.ltp)}
                                            </div>
                                            {stock.lastUpdated && (
                                                <div className="text-[10px] text-text-muted mt-0.5">
                                                    {new Date(stock.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-xs font-medium flex items-center ${change.isPositive ? 'text-profit' : 'text-loss'}`}>
                                            {change.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                            {change.text}
                                        </div>
                                    </div>

                                    {/* Quick Trade Buttons */}
                                    <div className="flex space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => onTrade(stock, 'BUY')}
                                            className="flex-1 px-2 py-1 text-xs font-medium text-success hover:bg-success/10 rounded transition"
                                        >
                                            Buy
                                        </button>
                                        <button
                                            onClick={() => onTrade(stock, 'SELL')}
                                            className="flex-1 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 rounded transition"
                                        >
                                            Sell
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
