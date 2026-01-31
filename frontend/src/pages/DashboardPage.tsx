import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useUpstoxStore } from '../stores/upstoxStore';
import { WatchlistSidebar } from '../components/WatchlistSidebar';
import { ChartModal } from '../components/ChartModal';

// Sector mapping
const SECTOR_MAP: Record<string, string> = {
    'RELIANCE': 'Energy',
    'TCS': 'Technology',
    'INFY': 'Technology',
    'WIPRO': 'Technology',
    'HDFCBANK': 'Finance',
    'ICICIBANK': 'Finance',
    'SBIN': 'Finance',
    'KOTAKBANK': 'Finance',
    'AXISBANK': 'Finance',
    'ITC': 'FMCG',
    'HINDUNILVR': 'FMCG',
    'BRITANNIA': 'FMCG',
    'BAJFINANCE': 'Finance',
    'MARUTI': 'Automobile',
    'TATAMOTORS': 'Automobile',
    'M&M': 'Automobile',
    'SUNPHARMA': 'Pharma',
    'DRREDDY': 'Pharma',
    'CIPLA': 'Pharma',
    'ONGC': 'Energy',
    'COALINDIA': 'Energy',
};

const getSector = (symbol: string): string => SECTOR_MAP[symbol] || 'Others';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket, prices } = useMarketStore();
    const { portfolio, fetchPortfolio, updatePortfolioWithPrices, executeTrade } = usePortfolioStore();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const { isConnected: upstoxConnected, connect: connectUpstox, disconnect: disconnectUpstox, checkStatus: checkUpstoxStatus } = useUpstoxStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('All');
    const [sortBy, setSortBy] = useState('symbol-asc');
    const [quickFilter, setQuickFilter] = useState('');

    // Use IDs to track selected items so we always get fresh data from store
    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(null);
    const [chartStockKey, setChartStockKey] = useState<string | null>(null);

    // Derive live objects
    const selectedStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === selectedStockKey) || null,
        [stocks, selectedStockKey]);

    const chartStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === chartStockKey) || null,
        [stocks, chartStockKey]);

    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [productType, setProductType] = useState<'MIS' | 'CNC'>('CNC');
    const [quantity, setQuantity] = useState(1);
    const [isTrading, setIsTrading] = useState(false);

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

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const handleTrade = async () => {
        if (!selectedStock || quantity < 1) return;

        setIsTrading(true);
        try {
            await executeTrade(
                selectedStock.symbol,
                selectedStock.instrumentKey,
                tradeType,
                quantity
            );

            await fetchPortfolio();
            setSelectedStockKey(null);
            setQuantity(1);
            setTradeType('BUY');
        } catch (error) {
            console.error('Trade failed:', error);
            alert('Trade failed. Please try again.');
        } finally {
            setIsTrading(false);
        }
    };

    const openTradeModal = (stock: any, type: 'BUY' | 'SELL') => {
        setSelectedStockKey(stock.instrumentKey);
        setTradeType(type);
        setProductType('CNC'); // Default to delivery
        setQuantity(1);
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

    const calculateTotal = () => {
        return selectedStock ? ((selectedStock.ltp || 0) * quantity).toFixed(2) : '0.00';
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Professional Navigation Bar */}
            <nav className="bg-surface border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        {/* Logo and Nav */}
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold text-primary">SimVest</h1>
                            <div className="hidden md:flex space-x-1">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                                >
                                    Portfolio
                                </button>
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                                >
                                    Orders
                                </button>
                            </div>
                        </div>

                        {/* Global Search Bar */}
                        <div className="flex-1 max-w-lg px-8 hidden md:block">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-text-secondary group-focus-within:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background-light placeholder-text-secondary focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="Search stocks, companies..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User Section */}
                        <div className="flex items-center space-x-3">
                            {/* Upstox Connection Status */}
                            {upstoxConnected ? (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1 px-3 py-1.5 bg-profit/10 rounded">
                                        <div className="w-2 h-2 bg-profit rounded-full animate-pulse"></div>
                                        <span className="text-xs font-medium text-profit">Live Data Active</span>
                                    </div>
                                    <button
                                        onClick={disconnectUpstox}
                                        className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-loss hover:bg-loss/5 rounded transition"
                                        title="Disconnect from Upstox"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={connectUpstox}
                                    className="px-4 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition flex items-center space-x-2"
                                    title="Connect to Upstox for live market data (Admin only)"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Enable Live Data</span>
                                </button>
                            )}

                            <span className="text-sm text-text-secondary">{user?.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger/5 rounded transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Layout with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Watchlist Sidebar */}
                < WatchlistSidebar onTrade={openTradeModal} />

                {/* Main Content */}
                < div className="flex-1 overflow-y-auto" >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Portfolio Summary Cards */}
                        {portfolio && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="card p-4">
                                    <p className="text-xs text-text-secondary mb-1">Total Value</p>
                                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.totalValue.toFixed(2)}</p>
                                </div>
                                <div className="card p-4">
                                    <p className="text-xs text-text-secondary mb-1">Investment</p>
                                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.totalInvestment.toFixed(2)}</p>
                                </div>
                                <div className="card p-4">
                                    <p className="text-xs text-text-secondary mb-1">P&L</p>
                                    <p className={`text-2xl font-semibold ${portfolio.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {portfolio.totalPnL >= 0 ? '+' : ''}₹{portfolio.totalPnL.toFixed(2)}
                                    </p>
                                </div>
                                <div className="card p-4">
                                    <p className="text-xs text-text-secondary mb-1">P&L %</p>
                                    <p className={`text-2xl font-semibold ${portfolio.totalPnLPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {portfolio.totalPnLPercent >= 0 ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Market Watch */}
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
                                {/* Search removed from here (moved to header) */}

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
                                            return (
                                                <tr key={stock.instrumentKey} className="table-row">
                                                    <td className="py-3 px-3 text-sm font-medium text-text-primary">{stock.symbol}</td>
                                                    <td className="py-3 px-3 text-sm text-text-primary text-right">{formatPrice(stock.ltp)}</td>
                                                    <td className={`py-3 px-3 text-sm text-right ${change.isPositive ? 'text-profit' : 'text-loss'}`}>
                                                        {change.text}
                                                    </td>
                                                    <td className="py-3 px-3 text-right space-x-2">
                                                        <button
                                                            onClick={() => setChartStockKey(stock.instrumentKey)}
                                                            className="px-2 py-1 text-xs hover:bg-surface-hover rounded transition"
                                                            title="View Chart"
                                                        >
                                                            📈
                                                        </button>
                                                        <button
                                                            onClick={() => {
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
                                                            onClick={() => openTradeModal(stock, 'BUY')}
                                                            className="px-3 py-1 text-xs font-medium text-success hover:bg-success/10 rounded transition"
                                                        >
                                                            B
                                                        </button>
                                                        <button
                                                            onClick={() => openTradeModal(stock, 'SELL')}
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

                        {/* Trade Modal */}
                        {selectedStock && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-text-primary">
                                                {tradeType} {selectedStock.symbol}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedStockKey(null)}
                                                className="text-text-secondary hover:text-text-primary"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-3">
                                                    Product Type
                                                </label>
                                                <div className="flex space-x-2 mb-4">
                                                    <button
                                                        onClick={() => setProductType('MIS')}
                                                        className={`flex-1 py-2 text-xs font-medium rounded transition border ${productType === 'MIS'
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-transparent text-text-secondary border-border hover:border-primary'
                                                            }`}
                                                    >
                                                        Intraday (MIS)
                                                    </button>
                                                    <button
                                                        onClick={() => setProductType('CNC')}
                                                        className={`flex-1 py-2 text-xs font-medium rounded transition border ${productType === 'CNC'
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-transparent text-text-secondary border-border hover:border-primary'
                                                            }`}
                                                    >
                                                        Long-term (CNC)
                                                    </button>
                                                </div>

                                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                                    Price
                                                </label>
                                                <p className="text-lg font-semibold text-text-primary">
                                                    {formatPrice(selectedStock.ltp)}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-border">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-text-secondary">Total</span>
                                                    <span className="font-semibold text-text-primary">₹{calculateTotal()}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleTrade}
                                                disabled={isTrading}
                                                className={`w-full py-2.5 text-sm font-medium text-white rounded transition ${tradeType === 'BUY'
                                                    ? 'bg-success hover:bg-success-dark'
                                                    : 'bg-danger hover:bg-danger-dark'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isTrading ? 'Processing...' : `${tradeType} ${quantity} Share${quantity > 1 ? 's' : ''}`}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
