import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket, prices } = useMarketStore();
    const { portfolio, orders, fetchPortfolio, fetchOrders, updatePortfolioWithPrices } = usePortfolioStore();
    const { checkStatus: checkUpstoxStatus } = useUpstoxStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInstruments();
        fetchPortfolio();
        fetchOrders();
        connectWebSocket();
        checkUpstoxStatus();

        return () => {
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (prices.size > 0) {
            updatePortfolioWithPrices(prices);
        }
    }, [prices]);

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden text-text-primary">
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
                <div className="w-80 md:w-96 border-r border-border bg-surface/30 flex flex-col">
                    <ErrorBoundary>
                        <MarketWatch
                            stocks={stocks}
                            searchTerm={searchTerm}
                            isLoading={stocks.length === 0}
                            compact={true}
                        />
                    </ErrorBoundary>
                </div>

                {/* Center Panel: Main Workspace */}
                <div className="flex-1 overflow-y-auto bg-background p-1">
                    <div className="max-w-7xl mx-auto space-y-4 p-4">
                        {/* Indices Ticker */}
                        <ErrorBoundary>
                            <MarketIndices />
                        </ErrorBoundary>

                        {/* Market Overview Widgets */}
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Market Overview</h2>
                            <ErrorBoundary>
                                <MarketOverview stocks={stocks} isLoading={stocks.length === 0} />
                            </ErrorBoundary>
                        </div>

                        {/* Recent Activity & Pulse */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                            <RecentActivity orders={orders} />
                            <MarketPulse />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
