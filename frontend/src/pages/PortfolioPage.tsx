import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';

export const PortfolioPage = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { prices, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const { portfolio, fetchPortfolio, updatePortfolioWithPrices } = usePortfolioStore();

    const holdings = portfolio?.holdings || [];

    useEffect(() => {
        // Fetch portfolio data
        fetchPortfolio();

        // Connect to WebSocket for real-time updates
        connectWebSocket();

        return () => {
            disconnectWebSocket();
        };
    }, []); // Empty deps - run once on mount

    useEffect(() => {
        if (prices.size > 0) {
            updatePortfolioWithPrices(prices);
        }
    }, [prices, updatePortfolioWithPrices]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <nav className="bg-surface border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold text-primary">SimVest</h1>
                            <div className="hidden md:flex space-x-1">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded"
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Portfolio Summary */}
                {portfolio && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="card p-4">
                            <p className="text-xs text-text-secondary mb-1">Total Value</p>
                            <p className="text-2xl font-semibold text-text-primary">{formatPrice(portfolio.totalValue)}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-xs text-text-secondary mb-1">Investment</p>
                            <p className="text-2xl font-semibold text-text-primary">{formatPrice(portfolio.totalInvestment)}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-xs text-text-secondary mb-1">P&L</p>
                            <p className={`text-2xl font-semibold ${portfolio.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {formatPrice(portfolio.totalPnL)}
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

                {/* Holdings Table */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Holdings</h2>

                    {holdings.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-text-secondary">No holdings yet</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-4 btn-primary"
                            >
                                Start Trading
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary">Symbol</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Qty</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Avg Price</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">LTP</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">Current Value</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">P&L</th>
                                        <th className="py-2 px-3 text-xs font-medium text-text-secondary text-right">P&L %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map((holding) => (
                                        <tr key={holding.instrumentKey} className="table-row">
                                            <td className="py-3 px-3 text-sm font-medium text-text-primary">{holding.symbol}</td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{holding.quantity}</td>
                                            <td className="py-3 px-3 text-sm text-text-secondary text-right">{formatPrice(holding.avgPrice)}</td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{formatPrice(holding.currentPrice || holding.avgPrice)}</td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{formatPrice((holding.currentPrice || holding.avgPrice) * holding.quantity)}</td>
                                            <td className={`py-3 px-3 text-sm text-right ${(holding.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {formatPrice(holding.pnl || 0)}
                                            </td>
                                            <td className={`py-3 px-3 text-sm text-right ${(holding.pnlPercent || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {(holding.pnlPercent || 0).toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
