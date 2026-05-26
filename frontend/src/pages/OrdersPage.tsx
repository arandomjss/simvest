import { useEffect } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Navbar } from '../components/Navbar';
import { OrdersTable } from '../components/OrdersTable';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PortfolioStrip } from '../components/Dashboard/PortfolioStrip';
import toast from 'react-hot-toast';

export const OrdersPage = () => {
    const { orders, fetchOrders, portfolio, fetchPortfolio } = usePortfolioStore();

    useEffect(() => {
        fetchOrders();
        fetchPortfolio();
    }, []);

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Top Navigation */}
            <div className="flex-none">
                <Navbar />
            </div>

            {/* Status Bar (Portfolio Metrics) - Consistent with Dashboard */}
            <div className="flex-none">
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
                        <button
                            onClick={async () => {
                                try {
                                    const { apiService } = await import('../services/api');
                                    const blob = await apiService.exportOrdersXml();
                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', 'trade_history.xml');
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (error) {
                                    console.error('Failed to export XML:', error);
                                    toast.error('Failed to export XML. Please try again.');
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Export XML
                        </button>
                    </div>

                    <ErrorBoundary>
                        <OrdersTable orders={orders} />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};
