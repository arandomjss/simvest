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
    const { prices, stocks, fetchInstruments, connectWebSocket, disconnectWebSocket } = useMarketStore();
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
        if (stocks.length === 0) {
            fetchInstruments();
        }
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
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    {/* Charts Grid */}
                    {/* Charts Grid */}
                    {portfolio && holdings.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Performance History */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Performance History</h3>
                                </div>
                                <div className="flex-1 p-0">
                                    <PortfolioPerformanceChart history={portfolioHistory} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Allocation</h3>
                                </div>
                                <div className="flex-1 flex items-center justify-center p-4">
                                    <SectorAllocationChart holdings={holdings} stocks={stocks} />
                                </div>
                            </div>

                            {/* News Feed */}
                            <div className="lg:col-span-2 h-80">
                                <PortfolioNews holdings={holdings} />
                            </div>

                            {/* Risk Analysis */}
                            <div className="h-80">
                                <PortfolioRiskAnalysis holdings={holdings} totalValue={portfolio.totalValue} stocks={stocks} />
                            </div>


                        </div>
                    )}


                    {/* Holdings Ledger */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Active Holdings
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs text-gray-500 font-medium">
                                    {holdings.length}
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/practice')}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-all shadow-sm shadow-primary/20"
                                >
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
                                            ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {sector}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            {holdings.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-2xl">💼</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Portfolio is Empty</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mb-6 text-sm">
                                        Start building your wealth by adding your first position in the Terminal.
                                    </p>
                                    <button
                                        onClick={() => navigate('/practice')}
                                        className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-all"
                                    >
                                        Go to Terminal
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                                            <tr>
                                                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Instrument</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Sector</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Avg. Price</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">LTP</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Value</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {filteredHoldings.map((holding) => {
                                                const stock = stocks.find(s => s.instrumentKey === holding.instrumentKey);
                                                const isProfit = (holding.pnl || 0) >= 0;
                                                const sector = getSector(holding.symbol);
                                                const sectorColor = SECTOR_COLORS[sector] || SECTOR_COLORS['Others'];

                                                return (
                                                    <tr key={holding.instrumentKey} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                                                                    style={{ backgroundColor: sectorColor }}
                                                                >
                                                                    {holding.symbol[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900 dark:text-white">{holding.symbol}</div>
                                                                    <div className="text-xs text-gray-500 truncate max-w-[140px]">{stock?.name || 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                                                                {sector}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {holding.quantity}
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-mono text-sm text-gray-500">
                                                            {formatPrice(holding.avgPrice)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatPrice(holding.currentPrice || holding.avgPrice)}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                                                            {formatPrice((holding.currentPrice || holding.avgPrice) * holding.quantity)}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className={`font-mono text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {isProfit ? '+' : ''}{formatPrice(holding.pnl || 0)}
                                                            </div>
                                                            <div className={`text-xs font-medium mt-0.5 ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {isProfit ? '▲' : '▼'} {(Math.abs(holding.pnlPercent || 0)).toFixed(2)}%
                                                            </div>
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
