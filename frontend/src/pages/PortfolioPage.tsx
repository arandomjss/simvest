import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { PortfolioPerformanceChart } from '../components/PortfolioPerformanceChart';
import { SectorAllocationChart } from '../components/SectorAllocationChart';
import { TopGainersLosers } from '../components/TopGainersLosers';
import { generatePortfolioHistory, getTodaysPnL } from '../services/portfolioHistory';
import { Navbar } from '../components/Navbar';
import { OrdersTable } from '../components/OrdersTable';

export const PortfolioPage = () => {
    const navigate = useNavigate();
    const { prices, stocks, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const { portfolio, orders, fetchPortfolio, fetchOrders, updatePortfolioWithPrices } = usePortfolioStore();

    const holdings = portfolio?.holdings || [];

    // Generate portfolio history
    const portfolioHistory = useMemo(() => {
        if (!portfolio) return [];
        return generatePortfolioHistory(
            portfolio.totalValue,
            portfolio.totalInvestment,
            365
        );
    }, [portfolio?.totalValue, portfolio?.totalInvestment]);

    // Calculate today's P&L
    const todaysPnL = useMemo(() => {
        return getTodaysPnL(portfolioHistory);
    }, [portfolioHistory]);

    useEffect(() => {
        // Fetch portfolio data
        fetchPortfolio();
        fetchOrders();

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

    const formatPrice = (price: number | undefined) => {
        if (price === undefined || price === null) {
            return 'N/A';
        }
        return `₹${price.toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Performance Metrics */}
                {portfolio && (
                    <PerformanceMetrics
                        portfolio={{
                            totalValue: portfolio.totalValue,
                            totalInvested: portfolio.totalInvestment,
                            totalPnL: portfolio.totalPnL,
                            totalPnLPercent: portfolio.totalPnLPercent,
                        }}
                        todaysPnL={todaysPnL}
                        holdingsCount={holdings.length}
                    />
                )}

                {/* Charts */}
                {portfolio && holdings.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="lg:col-span-2">
                            <PortfolioPerformanceChart history={portfolioHistory} />
                        </div>
                        <div>
                            <SectorAllocationChart holdings={holdings} />
                        </div>
                    </div>
                )}

                {/* Top Gainers/Losers */}
                {holdings.length > 0 && (
                    <div className="mb-6">
                        <TopGainersLosers holdings={holdings} />
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
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">
                                                <div className="flex flex-col items-end">
                                                    <span>{formatPrice(holding.currentPrice || holding.avgPrice)}</span>
                                                    <span className="text-[10px] text-text-secondary opacity-70">
                                                        {stocks.find(s => s.instrumentKey === holding.instrumentKey)?.lastUpdated
                                                            ? new Date(stocks.find(s => s.instrumentKey === holding.instrumentKey)!.lastUpdated!).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                            : '--:--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-sm text-text-primary text-right">{formatPrice((holding.currentPrice || holding.avgPrice) * holding.quantity)}</td>
                                            <td className={`py-3 px-3 text-sm text-right ${(holding.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {formatPrice(holding.pnl || 0)}
                                            </td>
                                            <td className={`py-3 px-3 text-sm text-right ${(holding.pnlPercent !== undefined && holding.pnlPercent !== null) ? holding.pnlPercent.toFixed(2) : 'N/A'}`}>
                                                {(holding.pnlPercent !== undefined && holding.pnlPercent !== null) ? holding.pnlPercent.toFixed(2) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Orders History */}
                <div className="mt-8 mb-12">
                    <OrdersTable orders={orders} />
                </div>
            </div>
        </div>
    );
};
