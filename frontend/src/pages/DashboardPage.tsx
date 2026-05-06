import { useEffect, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useUpstoxStore } from '../stores/upstoxStore';
import { Navbar } from '../components/Navbar';
import { MarketOverview } from '../components/MarketOverview';
import { MarketWatch } from '../components/MarketWatch';
import { Stock } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PortfolioStrip } from '../components/Dashboard/PortfolioStrip';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { MarketPulse } from '../components/Dashboard/MarketPulse';
import { MarketIndices } from '../components/Dashboard/MarketIndices';
import { ChartModal } from '../components/ChartModal';
import { Footer } from '../components/Footer';


export const DashboardPage = () => {
    const { stocks, fetchInstruments, prices, isLoading: isMarketLoading } = useMarketStore();
    const { portfolio, orders, fetchPortfolio, fetchOrders, updatePortfolioWithPrices } = usePortfolioStore();
    const { checkStatus: checkUpstoxStatus } = useUpstoxStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    useEffect(() => {
        fetchInstruments();
        fetchPortfolio();
        fetchOrders();
        checkUpstoxStatus();
    }, []);

    useEffect(() => {
        if (prices.size > 0) {
            updatePortfolioWithPrices(prices);
        }
    }, [prices]);

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Top Navigation */}
            <div className="flex-none">
                <Navbar
                    showSearch={true}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
            </div>

            {/* Status Bar (Portfolio Metrics) */}
            <div className="flex-none">
                <PortfolioStrip portfolio={portfolio} />
            </div>

            {/* Main Terminal Grid */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Market Watch (Sidebar) */}
                <div className="w-80 md:w-96 border-r border-gray-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 flex flex-col">
                    <ErrorBoundary>
                        <MarketWatch
                            stocks={stocks}
                            searchTerm={searchTerm}
                            isLoading={isMarketLoading}
                            compact={true}
                        />
                    </ErrorBoundary>
                </div>

                {/* Center Panel: Main Workspace */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-1">
                    <div className="max-w-7xl mx-auto space-y-4 p-4">
                        {/* Indices Ticker */}
                        <ErrorBoundary>
                            <MarketIndices onIndexClick={setSelectedStock} />
                        </ErrorBoundary>

                        {/* Market Overview Widgets */}
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Market Overview</h2>
                            <ErrorBoundary>
                                <MarketOverview stocks={stocks} isLoading={isMarketLoading} />
                            </ErrorBoundary>
                        </div>

                        {/* Recent Activity & Pulse */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                            <RecentActivity orders={orders} />
                            <MarketPulse />
                        </div>
                    </div>
                    {selectedStock && (
                        <ChartModal
                            stock={selectedStock}
                            onClose={() => setSelectedStock(null)}
                        />
                    )}

                    {/* XML Driven Footer */}
                    <div className="mt-8">
                        <Footer />
                    </div>
                </div>

            </div>
        </div>
    );
};
