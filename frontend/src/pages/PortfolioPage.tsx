import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { PortfolioPerformanceChart } from '../components/PortfolioPerformanceChart';
import { SectorAllocationChart } from '../components/SectorAllocationChart';
import { generatePortfolioHistory } from '../services/portfolioHistory';
import { Navbar } from '../components/Navbar';
import { PortfolioStrip } from '../components/Dashboard/PortfolioStrip';
import { getSector, SECTOR_COLORS } from '../utils/sectorUtils';
import { PortfolioRiskAnalysis } from '../components/PortfolioRiskAnalysis';
import { PortfolioNews } from '../components/PortfolioNews';

export const PortfolioPage = () => {
    const navigate = useNavigate();
    const { prices, stocks, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const { portfolio, fetchPortfolio, updatePortfolioWithPrices } = usePortfolioStore();

    const holdings = portfolio?.holdings || [];

    const [selectedSector, setSelectedSector] = useState<string>('All');

    const availableSectors = useMemo(() => {
        const sectors = new Set<string>(['All']);
        holdings.forEach(h => sectors.add(getSector(h.symbol)));
        return Array.from(sectors);
    }, [holdings]);

    const filteredHoldings = useMemo(() => {
        if (selectedSector === 'All') return holdings;
        return holdings.filter(h => getSector(h.symbol) === selectedSector);
    }, [holdings, selectedSector]);

    // Generate portfolio history
    const portfolioHistory = useMemo(() => {
        if (!portfolio) return [];
        return generatePortfolioHistory(
            portfolio.totalValue,
            portfolio.totalInvestment,
            365
        );
    }, [portfolio?.totalValue, portfolio?.totalInvestment]);

    useEffect(() => {
        fetchPortfolio();
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);

    useEffect(() => {
        if (prices.size > 0) {
            updatePortfolioWithPrices(prices);
        }
    }, [prices, updatePortfolioWithPrices]);

    const formatPrice = (price?: number) => {
        if (price === undefined || price === null || isNaN(price)) return '₹0.00';
        return `₹${price.toFixed(2)}`;
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Header Section */}
            <div className="flex-none z-30 relative bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <Navbar />
                <PortfolioStrip portfolio={portfolio} />
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                    {/* Charts Grid */}
                    {/* Charts Grid */}
                    {portfolio && holdings.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Performance History */}
                            <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-1 overflow-hidden">
                                <div className="p-3 border-b border-border flex justify-between items-center bg-surface-hover/30">
                                    <h3 className="text-sm font-bold text-text-primary">Performance History</h3>
                                    <span className="text-xs text-text-secondary">1 Year</span>
                                </div>
                                <div className="p-4">
                                    <PortfolioPerformanceChart history={portfolioHistory} />
                                </div>
                            </div>

                            <div className="bg-surface border border-border rounded-lg p-1 flex flex-col">
                                <div className="p-3 border-b border-border bg-surface-hover/30">
                                    <h3 className="text-sm font-bold text-text-primary">Allocation</h3>
                                </div>
                                <div className="p-4 flex-1 flex items-center justify-center">
                                    <SectorAllocationChart holdings={holdings} />
                                </div>
                            </div>

                            {/* News Feed */}
                            <div className="lg:col-span-2 h-80">
                                <PortfolioNews holdings={holdings} />
                            </div>

                            {/* Risk Analysis */}
                            <div className="h-80">
                                <PortfolioRiskAnalysis holdings={holdings} totalValue={portfolio.totalValue} />
                            </div>


                        </div>
                    )}


                    {/* Holdings Ledger */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">Active Holdings</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigate('/practice')} className="text-sm text-primary hover:text-primary-hover font-medium">
                                    + Add Position
                                </button>
                            </div>
                        </div>

                        {/* Sector Filters */}
                        {availableSectors.length > 1 && (
                            <div className="flex flex-wrap gap-2 pb-2">
                                {availableSectors.map(sector => (
                                    <button
                                        key={sector}
                                        onClick={() => setSelectedSector(sector)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${selectedSector === sector
                                            ? 'bg-primary text-white'
                                            : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover'
                                            }`}
                                    >
                                        {sector}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                            {holdings.length === 0 ? (
                                // ... Empty state
                                <div className="text-center py-16">
                                    <div className="text-4xl mb-4">💼</div>
                                    <p className="text-text-secondary mb-4">Your portfolio is empty.</p>
                                    <button
                                        onClick={() => navigate('/practice')}
                                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition-colors"
                                    >
                                        Start Trading
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-surface-hover/50 border-b border-border">
                                            <tr>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-left">Instrument</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-left">Sector</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Qty</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Avg.</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">LTP</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Cur. Value</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">P&L</th>
                                                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">% Chg</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredHoldings.map((holding) => {
                                                const stock = stocks.find(s => s.instrumentKey === holding.instrumentKey);
                                                const isProfit = (holding.pnl || 0) >= 0;
                                                const sector = getSector(holding.symbol);
                                                const sectorColor = SECTOR_COLORS[sector] || SECTOR_COLORS['Others'];

                                                return (
                                                    <tr key={holding.instrumentKey} className="hover:bg-surface-hover transition-colors group">
                                                        <td className="py-3 px-4 text-sm font-bold text-text-primary">
                                                            <div>{holding.symbol}</div>
                                                            <div className="text-[10px] text-text-secondary font-normal truncate max-w-[120px]">{stock?.name || 'Unknown'}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${sectorColor}20`, color: sectorColor }}>
                                                                {sector}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">{holding.quantity}</td>
                                                        <td className="py-3 px-4 text-sm font-mono text-text-secondary text-right">{formatPrice(holding.avgPrice)}</td>
                                                        <td className="py-3 px-4 text-sm text-right">
                                                            <div className="font-mono text-text-primary">{formatPrice(holding.currentPrice || holding.avgPrice)}</div>
                                                            <div className="text-[10px] text-text-secondary opacity-60">
                                                                {stock?.lastUpdated ? new Date(stock.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-mono text-text-primary text-right font-medium">
                                                            {formatPrice((holding.currentPrice || holding.avgPrice) * holding.quantity)}
                                                        </td>
                                                        <td className={`py-3 px-4 text-sm font-mono text-right font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                                                            {isProfit ? '+' : ''}{formatPrice(holding.pnl || 0)}
                                                        </td>
                                                        <td className={`py-3 px-4 text-right`}>
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold font-mono ${isProfit ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                                                                {isProfit ? '+' : ''}{(holding.pnlPercent || 0).toFixed(2)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};
