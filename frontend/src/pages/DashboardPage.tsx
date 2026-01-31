import { useEffect, useState, useMemo } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useUpstoxStore } from '../stores/upstoxStore';
import { WatchlistSidebar } from '../components/WatchlistSidebar';
import { ChartModal } from '../components/ChartModal';
import { Navbar } from '../components/Navbar';
import { MarketOverview } from '../components/MarketOverview';
import { getSector } from '../utils/sectorUtils';
import { Stock } from '../types';

export const DashboardPage = () => {
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket, prices } = useMarketStore();
    const { portfolio, fetchPortfolio, updatePortfolioWithPrices, executeTrade } = usePortfolioStore();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const { checkStatus: checkUpstoxStatus } = useUpstoxStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('All');
    const [sortBy, setSortBy] = useState('symbol-asc');
    const [quickFilter, setQuickFilter] = useState('');

    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(null);
    const [chartStockKey, setChartStockKey] = useState<string | null>(null);

    // Derive live objects
    const selectedStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === selectedStockKey) || null,
        [stocks, selectedStockKey]);

    const chartStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === chartStockKey) || null,
        [stocks, chartStockKey]);



    useEffect(() => {
        fetchInstruments();
        fetchPortfolio();
        connectWebSocket();
        checkUpstoxStatus(); // Check if already connected to Upstox

        return () => {
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (prices.size > 0) {
            updatePortfolioWithPrices(prices);
        }
    }, [prices]);



    const openTradeModal = (stock: Stock, side: 'BUY' | 'SELL' = 'BUY') => {
        // Redirect to detail/practice page
        window.location.href = `/practice?symbol=${stock.symbol}&side=${side}`;
    };

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
        if (sectorFilter !== 'All') {
            result = result.filter((stock) => getSector(stock.symbol) === sectorFilter);
        }

        // Apply quick filters
        if (quickFilter === 'gainers') {
            result = result.filter((stock) => (stock.changePercent || 0) > 0);
        } else if (quickFilter === 'losers') {
            result = result.filter((stock) => (stock.changePercent || 0) < 0);
        } else if (quickFilter === 'active') {
            // Sort by volume and take top stocks
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
    }, [stocks, searchTerm, sectorFilter, sortBy, quickFilter, isInWatchlist]);

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSectorFilter('All');
        setSortBy('symbol-asc');
        setQuickFilter('');
    };

    // Check if any filters are active
    const hasActiveFilters = searchTerm || sectorFilter !== 'All' || quickFilter || sortBy !== 'symbol-asc';

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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                showSearch={true}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {/* Main Layout with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Watchlist Sidebar */}
                < WatchlistSidebar onTrade={openTradeModal} />

                {/* Main Content */}
                < div className="flex-1 overflow-y-auto bg-background-light" >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                        {/* Portfolio Summary Cards */}
                        {portfolio && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="card p-4 border-l-4 border-primary">
                                    <p className="text-xs text-text-secondary mb-1">Total Value</p>
                                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.totalValue.toFixed(2)}</p>
                                </div>
                                <div className="card p-4 border-l-4 border-blue-400">
                                    <p className="text-xs text-text-secondary mb-1">Investment</p>
                                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.totalInvestment.toFixed(2)}</p>
                                </div>
                                <div className="card p-4 border-l-4 border-emerald-500">
                                    <p className="text-xs text-text-secondary mb-1">Buying Power</p>
                                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.cashBalance ? portfolio.cashBalance.toFixed(2) : '0.00'}</p>
                                </div>
                                <div className={`card p-4 border-l-4 ${portfolio.totalPnL >= 0 ? 'border-profit' : 'border-loss'}`}>
                                    <p className="text-xs text-text-secondary mb-1">P&L</p>
                                    <p className={`text-2xl font-semibold ${portfolio.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {portfolio.totalPnL >= 0 ? '+' : ''}₹{portfolio.totalPnL.toFixed(2)}
                                    </p>
                                </div>
                                <div className={`card p-4 border-l-4 ${portfolio.totalPnLPercent >= 0 ? 'border-profit' : 'border-loss'}`}>
                                    <p className="text-xs text-text-secondary mb-1">P&L %</p>
                                    <p className={`text-2xl font-semibold ${portfolio.totalPnLPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {portfolio.totalPnLPercent >= 0 ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Market Overview Widgets */}
                        <MarketOverview stocks={stocks} />

                        {/* Market Watch Table */}
                        <div className="card p-6">
                            {/* Header */}
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Market Watch</h2>

                            {/* Quick Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => setQuickFilter(quickFilter === 'gainers' ? '' : 'gainers')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${quickFilter === 'gainers'
                                        ? 'bg-profit text-white'
                                        : 'bg-profit/10 text-profit hover:bg-profit/20'
                                        }`}
                                >
                                    🟢 Top Gainers
                                </button>
                                <button
                                    onClick={() => setQuickFilter(quickFilter === 'losers' ? '' : 'losers')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${quickFilter === 'losers'
                                        ? 'bg-loss text-white'
                                        : 'bg-loss/10 text-loss hover:bg-loss/20'
                                        }`}
                                >
                                    🔴 Top Losers
                                </button>
                                <button
                                    onClick={() => setQuickFilter(quickFilter === 'active' ? '' : 'active')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${quickFilter === 'active'
                                        ? 'bg-primary text-white'
                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                        }`}
                                >
                                    🔥 Most Active
                                </button>
                                <button
                                    onClick={() => setQuickFilter(quickFilter === 'watchlist' ? '' : 'watchlist')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${quickFilter === 'watchlist'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                >
                                    ⭐ Watchlist
                                </button>
                            </div>

                            {/* Search and Filters Bar */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                {/* Sector Filter */}
                                <select
                                    value={sectorFilter}
                                    onChange={(e) => setSectorFilter(e.target.value)}
                                    className="px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface"
                                >
                                    <option value="All">All Sectors</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Energy">Energy</option>
                                    <option value="FMCG">FMCG</option>
                                    <option value="Automobile">Automobile</option>
                                    <option value="Pharma">Pharma</option>
                                    <option value="Others">Others</option>
                                </select>

                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface"
                                >
                                    <option value="symbol-asc">Symbol (A-Z)</option>
                                    <option value="symbol-desc">Symbol (Z-A)</option>
                                    <option value="price-asc">Price (Low to High)</option>
                                    <option value="price-desc">Price (High to Low)</option>
                                    <option value="change-desc">Change % (High to Low)</option>
                                    <option value="change-asc">Change % (Low to High)</option>
                                </select>
                            </div>

                            {/* Filter Stats */}
                            <div className="flex items-center justify-between mb-4 text-xs text-text-secondary">
                                <span>
                                    Showing {filteredStocks.length} of {stocks.length} stocks
                                </span>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-primary hover:text-primary/80 font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="py-2 px-3 text-xs font-medium text-text-secondary">Symbol</th>
                                            <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">LTP</th>
                                            <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Change</th>
                                            <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map((stock) => {
                                            const change = formatChange(stock.change, stock.changePercent);
                                            const isSelected = chartStockKey === stock.instrumentKey;
                                            return (
                                                <tr
                                                    key={stock.instrumentKey}
                                                    className={`table-row cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                    onClick={() => setChartStockKey(stock.instrumentKey)}
                                                >
                                                    <td className="py-3 px-3 text-sm font-medium text-text-primary">
                                                        {stock.symbol}
                                                    </td>
                                                    <td className="py-3 px-3 text-sm text-text-primary text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span>{formatPrice(stock.ltp)}</span>
                                                            <span className="text-[10px] text-text-secondary opacity-70">
                                                                {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={`py-3 px-3 text-sm text-right ${change.isPositive ? 'text-profit' : 'text-loss'}`}>
                                                        {change.text}
                                                    </td>
                                                    <td className="py-3 px-3 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setChartStockKey(stock.instrumentKey);
                                                            }}
                                                            className={`px-2 py-1 text-xs rounded transition border hover:bg-surface-hover border-transparent`}
                                                            title="View Chart"
                                                        >
                                                            📈
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isInWatchlist(stock.instrumentKey)) {
                                                                    removeFromWatchlist(stock.instrumentKey);
                                                                } else {
                                                                    addToWatchlist(stock.instrumentKey);
                                                                }
                                                            }}
                                                            className="px-2 py-1 text-xs hover:bg-surface-hover rounded transition"
                                                            title={isInWatchlist(stock.instrumentKey) ? "Remove from watchlist" : "Add to watchlist"}
                                                        >
                                                            {isInWatchlist(stock.instrumentKey) ? '⭐' : '☆'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openTradeModal(stock, 'BUY');
                                                            }}
                                                            className="px-3 py-1 text-xs font-medium text-success hover:bg-success/10 rounded transition"
                                                        >
                                                            B
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openTradeModal(stock, 'SELL');
                                                            }}
                                                            className="px-3 py-1 text-xs font-medium text-danger hover:bg-danger/10 rounded transition"
                                                        >
                                                            S
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart Modal */}
                        {chartStock && (
                            <ChartModal
                                stock={chartStock}
                                onClose={() => setChartStockKey(null)}
                            />
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
};
