import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Stock } from '../types';
import { useWatchlistStore } from '../stores/watchlistStore';
import { getSector } from '../utils/sectorUtils';
import { ChartModal } from './ChartModal';
import { Skeleton } from './common/Skeleton';

interface MarketWatchProps {
    stocks: Stock[];
    searchTerm: string;
    isLoading?: boolean;
    compact?: boolean;
}

export const MarketWatch = ({ stocks, searchTerm, isLoading = false, compact = false }: MarketWatchProps) => {
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();

    const [sectorFilter] = useState('All');
    const [sortBy] = useState('symbol-asc');
    const [quickFilter, setQuickFilter] = useState('');
    const [chartStockKey, setChartStockKey] = useState<string | null>(null);

    const chartStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === chartStockKey) || null,
        [stocks, chartStockKey]);

    // Comprehensive filtering and sorting
    const filteredStocks = useMemo(() => {
        let result = [...stocks];

        // Apply search filter
        if (searchTerm) {
            result = result.filter((stock) =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply sector filter
        if (!compact && sectorFilter !== 'All') {
            result = result.filter((stock) => (stock.sector || getSector(stock.symbol)) === sectorFilter);
        }

        // Apply quick filters
        if (quickFilter === 'gainers') {
            result = result.filter((stock) => (stock.changePercent || 0) > 0);
        } else if (quickFilter === 'losers') {
            result = result.filter((stock) => (stock.changePercent || 0) < 0);
        } else if (quickFilter === 'active') {
            result = result.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        } else if (quickFilter === 'watchlist') {
            result = result.filter((stock) => isInWatchlist(stock.instrumentKey));
        }

        // Apply sorting
        switch (sortBy) {
            case 'symbol-asc':
                result.sort((a, b) => a.symbol.localeCompare(b.symbol));
                break;
            case 'symbol-desc':
                result.sort((a, b) => b.symbol.localeCompare(a.symbol));
                break;
            case 'price-asc':
                result.sort((a, b) => (a.ltp || 0) - (b.ltp || 0));
                break;
            case 'price-desc':
                result.sort((a, b) => (b.ltp || 0) - (a.ltp || 0));
                break;
            case 'change-desc':
                result.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
                break;
            case 'change-asc':
                result.sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0));
                break;
            default:
                break;
        }

        return result;
    }, [stocks, searchTerm, sectorFilter, sortBy, quickFilter, isInWatchlist, compact]);

    const formatPrice = (price?: number) => {
        return price ? `₹${price.toFixed(2)}` : '—';
    };

    const formatChange = (change?: number, changePercent?: number) => {
        if (!change || !changePercent) return { text: '—', isPositive: true };
        const sign = change >= 0 ? '+' : '';
        return {
            text: `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
            isPositive: change >= 0
        };
    };

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-slate-800 ${compact ? '' : 'card p-6'}`}>
            {/* Header (Hidden in Compact Mode if using Sidebar Header) */}
            {!compact && <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Watch</h2>}

            {/* Filters */}
            <div className={`flex flex-wrap gap-2 ${compact ? 'p-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' : 'mb-4'}`}>
                <button
                    onClick={() => setQuickFilter(quickFilter === 'watchlist' ? '' : 'watchlist')}
                    className={`p-1.5 text-xs font-medium rounded transition flex items-center justify-center flex-1 ${quickFilter === 'watchlist'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 bg-surface hover:bg-surface-hover border-border text-text-secondary'
                        }`}
                    title="Watchlist"
                >
                    <Star className={`w-3.5 h-3.5 ${quickFilter === 'watchlist' ? 'fill-current' : ''}`} />
                    {compact && <span className="ml-1">Watchlist</span>}
                </button>
                <button
                    onClick={() => setQuickFilter(quickFilter === 'gainers' ? '' : 'gainers')}
                    className={`p-1.5 text-xs font-medium rounded transition flex items-center justify-center flex-1 ${quickFilter === 'gainers'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 bg-surface hover:bg-surface-hover border-border text-text-secondary'
                        }`}
                    title="Gainers"
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    {compact && <span className="ml-1.5 font-semibold">Gainers</span>}
                </button>
                <button
                    onClick={() => setQuickFilter(quickFilter === 'losers' ? '' : 'losers')}
                    className={`p-1.5 text-xs font-medium rounded transition flex items-center justify-center flex-1 ${quickFilter === 'losers'
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 bg-surface hover:bg-surface-hover border-border text-text-secondary'
                        }`}
                    title="Losers"
                >
                    <TrendingDown className="w-3.5 h-3.5" />
                    {compact && <span className="ml-1.5 font-semibold">Losers</span>}
                </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                <div className="col-span-4">Symbol</div>
                <div className="col-span-4 text-right">Price</div>
                <div className="col-span-4 text-right">Chg%</div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        <Skeleton height={20} className="w-full" />
                        <Skeleton height={20} className="w-full" />
                        <Skeleton height={20} className="w-full" />
                    </div>
                ) : (
                    filteredStocks.map((stock) => {
                        const change = formatChange(stock.change, stock.changePercent);
                        const isSelected = chartStockKey === stock.instrumentKey;
                        return (
                            <div
                                key={stock.instrumentKey}
                                className={`grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary' : ''}`}
                                onClick={() => setChartStockKey(stock.instrumentKey)}
                            >
                                <div className="col-span-4 flex items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isInWatchlist(stock.instrumentKey)) {
                                                removeFromWatchlist(stock.instrumentKey);
                                            } else {
                                                addToWatchlist(stock.instrumentKey);
                                            }
                                        }}
                                        className={`p-2 mr-1 rounded-full transition-colors hover:bg-surface-hover ${isInWatchlist(stock.instrumentKey) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                                        title={isInWatchlist(stock.instrumentKey) ? "Remove from Watchlist" : "Add to Watchlist"}
                                    >
                                        <Star className={`w-3.5 h-3.5 ${isInWatchlist(stock.instrumentKey) ? 'fill-current' : ''}`} />
                                    </button>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-text-primary leading-tight">{stock.symbol}</span>
                                        <span className="text-[10px] text-text-muted font-medium">{stock.sector || getSector(stock.symbol)}</span>
                                    </div>
                                </div>
                                <div className="col-span-4 flex flex-col items-end justify-center">
                                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                                        {formatPrice(stock.ltp)}
                                    </span>
                                </div>
                                <div className="col-span-4 flex flex-col items-end justify-center">
                                    <span className={`text-xs font-mono font-medium ${change.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {stock.changePercent?.toFixed(2)}%
                                    </span>
                                    <span className={`text-[10px] ${change.isPositive ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                                        {stock.change?.toFixed(2)}
                                    </span>
                                </div>

                                {/* Hover Actions (Optional - could add back if needed) */}
                            </div>
                        );
                    })
                )}
                {filteredStocks.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No stocks found
                    </div>
                )}
            </div>

            {/* Chart Modal */}
            {chartStock && (
                <ChartModal
                    stock={chartStock}
                    onClose={() => setChartStockKey(null)}
                />
            )}
        </div>
    );
};
