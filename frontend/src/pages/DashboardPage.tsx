import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { WatchlistSidebar } from '../components/WatchlistSidebar';
import { useWatchlistStore } from '../stores/watchlistStore';
import { WatchlistSidebar } from '../components/WatchlistSidebar';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket, prices } = useMarketStore();
    const { portfolio, fetchPortfolio, updatePortfolioWithPrices, executeTrade } = usePortfolioStore();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState(1);
    const [isTrading, setIsTrading] = useState(false);

    useEffect(() => {
        fetchInstruments();
        fetchPortfolio();
        connectWebSocket();

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
            setSelectedStock(null);
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
        setSelectedStock(stock);
        setTradeType(type);
        setQuantity(1);
    };

    const filteredStocks = stocks.filter((stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        return selectedStock ? (selectedStock.ltp * quantity).toFixed(2) : '0.00';
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

                        {/* User Section */}
                        <div className="flex items-center space-x-4">
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

            {/* Main Layout with Watchlist Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Watchlist Sidebar */}
                <WatchlistSidebar onTrade={openTradeModal} />

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <p className="text-xs text-text-secondary mb-1">Investment</p>
                    <p className="text-2xl font-semibold text-text-primary">₹{portfolio.totalInvestment.toFixed(2)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-text-secondary mb-1">P&L</p>
                    <p className={`text-2xl font-semibold ${portfolio.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                        ₹{portfolio.totalPnL.toFixed(2)}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-text-secondary mb-1">P&L %</p>
                    <p className={`text-2xl font-semibold ${portfolio.totalPnLPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {portfolio.totalPnLPercent.toFixed(2)}%
                    </p>
                </div>
            </div>
                    )}

            {/* Market Overview */}
            <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold text-text-primary">Market Watch</h2>
                        <span className="text-xs text-text-secondary">NIFTY 50</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search stocks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field w-64 text-sm"
                    />
                </div>

                {/* Stock Table */}
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
        </div>

                {/* Professional Trade Modal */ }
    {
        selectedStock && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                <div className="bg-surface rounded-lg shadow-lg max-w-md w-full">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center p-4 border-b border-border">
                        <h3 className="text-lg font-semibold text-text-primary">{selectedStock.symbol}</h3>
                        <button
                            onClick={() => setSelectedStock(null)}
                            className="text-text-secondary hover:text-text-primary"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 space-y-4">
                        {/* Stock Info */}
                        <div className="bg-background rounded p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-text-secondary">Last Price</span>
                                <span className="text-lg font-semibold text-text-primary">{formatPrice(selectedStock.ltp)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-text-secondary">Change</span>
                                <span className={`text-xs font-medium ${formatChange(selectedStock.change, selectedStock.changePercent).isPositive ? 'text-profit' : 'text-loss'}`}>
                                    {formatChange(selectedStock.change, selectedStock.changePercent).text}
                                </span>
                            </div>
                        </div>

                        {/* Trade Type */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setTradeType('BUY')}
                                className={`flex-1 py-2 rounded font-medium text-sm transition ${tradeType === 'BUY'
                                    ? 'bg-success text-white'
                                    : 'bg-background text-text-secondary hover:bg-background-dark'
                                    }`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setTradeType('SELL')}
                                className={`flex-1 py-2 rounded font-medium text-sm transition ${tradeType === 'SELL'
                                    ? 'bg-danger text-white'
                                    : 'bg-background text-text-secondary hover:bg-background-dark'
                                    }`}
                            >
                                Sell
                            </button>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input-field w-full"
                            />
                        </div>

                        {/* Total */}
                        <div className="bg-background rounded p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Total Amount</span>
                                <span className="text-xl font-semibold text-text-primary">₹{calculateTotal()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex space-x-3 p-4 border-t border-border">
                        <button
                            onClick={() => setSelectedStock(null)}
                            className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-background hover:bg-background-dark rounded transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTrade}
                            disabled={isTrading}
                            className={`flex-1 py-2.5 text-sm font-medium text-white rounded transition ${tradeType === 'BUY'
                                ? 'bg-success hover:bg-success-dark'
                                : 'bg-danger hover:bg-danger-dark'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isTrading ? 'Processing...' : `${tradeType} ${quantity} Share${quantity > 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
            </div >
        </div >
    );
};
