import { useEffect } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Navbar } from '../components/Navbar';
import { OrdersTable } from '../components/OrdersTable';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PortfolioStrip } from '../components/Dashboard/PortfolioStrip';

export const OrdersPage = () => {
    const { orders, fetchOrders, portfolio, fetchPortfolio } = usePortfolioStore();

    useEffect(() => {
        fetchOrders();
        fetchPortfolio();
    }, []);

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Top Navigation */}
            <div className="flex-none z-30 relative">
                <Navbar />
            </div>

            {/* Status Bar (Portfolio Metrics) - Consistent with Dashboard */}
            <div className="flex-none z-20 relative">
                <PortfolioStrip portfolio={portfolio} />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Order Book</h1>
                            <p className="text-text-secondary text-sm">Real-time trade execution history</p>
                        </div>
                    </div>

                    <ErrorBoundary>
                        <OrdersTable orders={orders} />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};
