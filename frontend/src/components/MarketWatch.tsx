import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Star, Plus, Trash2, Edit2, X } from 'lucide-react';
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
    const {
        watchlists, activeWatchlistId, setActiveWatchlist,
        createWatchlist, deleteWatchlist, renameWatchlist,
        isInWatchlist, addToWatchlist, removeFromWatchlist
    } = useWatchlistStore();

    const [sectorFilter] = useState('All');
    const [sortBy] = useState('symbol-asc');
    const [quickFilter, setQuickFilter] = useState('');
    const [chartStockKey, setChartStockKey] = useState<string | null>(null);
    const [managerModal, setManagerModal] = useState<{ isOpen: boolean; mode: 'create' | 'rename' | 'delete'; value: string } | null>(null);

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

            {/* Watchlist Manager */}
            {quickFilter === 'watchlist' && (
                <div className={`flex items-center gap-1.5 px-3 pb-3 ${compact ? 'border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800' : 'mb-2'} `}>
                    <div className="relative flex-1">
                        <select
                            value={activeWatchlistId}
                            onChange={(e) => setActiveWatchlist(e.target.value)}
                            className="w-full appearance-none bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 outline-none text-xs rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600/80 transition-colors"
                        >
                            {watchlists.map((wl: any) => (
                                <option key={wl.id} value={wl.id}>{wl.name} ({wl.items.length})</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={() => setManagerModal({ isOpen: true, mode: 'create', value: '' })}
                        className="p-2 rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                        title="Create Watchlist"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            const currentMatch = watchlists.find((w: any) => w.id === activeWatchlistId);
                            setManagerModal({ isOpen: true, mode: 'rename', value: currentMatch?.name || '' });
                        }}
                        className="p-2 rounded-lg transition-colors text-gray-600 bg-gray-50 hover:bg-gray-100 dark:text-gray-300 dark:bg-slate-700/50 dark:hover:bg-slate-600"
                        title="Rename Watchlist"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setManagerModal({ isOpen: true, mode: 'delete', value: '' })}
                        className={`p-2 rounded-lg transition-colors ${watchlists.length > 1 ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20' : 'text-gray-400 bg-gray-50 dark:bg-slate-800 dark:text-gray-600 cursor-not-allowed opacity-50'}`}
                        disabled={watchlists.length <= 1}
                        title="Delete Watchlist"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

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

            {/* Manager Modals */}
            {managerModal?.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {managerModal.mode === 'create' ? 'Create new Watchlist' :
                                    managerModal.mode === 'rename' ? 'Rename Watchlist' : 'Delete Watchlist'}
                            </h3>
                            <button onClick={() => setManagerModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {managerModal.mode !== 'delete' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Watchlist Name</label>
                                        <input
                                            type="text"
                                            value={managerModal.value}
                                            onChange={(e) => setManagerModal({ ...managerModal, value: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Eg. Tech Stocks, Daily Picks..."
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && managerModal.value.trim()) {
                                                    if (managerModal.mode === 'create') createWatchlist(managerModal.value.trim());
                                                    else renameWatchlist(activeWatchlistId, managerModal.value.trim());
                                                    setManagerModal(null);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Are you sure you want to delete this watchlist? This action cannot be undone.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setManagerModal(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (managerModal.mode === 'create') {
                                        createWatchlist(managerModal.value.trim());
                                    } else if (managerModal.mode === 'rename') {
                                        renameWatchlist(activeWatchlistId, managerModal.value.trim());
                                    } else if (managerModal.mode === 'delete') {
                                        deleteWatchlist(activeWatchlistId);
                                    }
                                    setManagerModal(null);
                                }}
                                disabled={managerModal.mode !== 'delete' && !managerModal.value.trim()}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${managerModal.mode === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {managerModal.mode === 'delete' ? 'Delete' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
