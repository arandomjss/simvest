import { useMemo } from 'react';
import { Stock } from '../types';
import { getSector } from '../utils/sectorUtils';
import { Skeleton } from './common/Skeleton';

interface MarketOverviewProps {
    stocks: Stock[];
    isLoading?: boolean;
    onStockClick?: (stock: Stock) => void;
}

export const MarketOverview = ({ stocks, isLoading = false, onStockClick }: MarketOverviewProps) => {

    // ... calculations (memoized) ...
    // Calculate Sector Performance
    const sectorPerformance = useMemo(() => {
        if (isLoading || stocks.length === 0) return [];
        const sectorMap: Record<string, { totalChange: number; count: number }> = {};
        stocks.forEach(stock => {
            const sector = stock.sector || getSector(stock.symbol);
            if (!sectorMap[sector]) sectorMap[sector] = { totalChange: 0, count: 0 };
            sectorMap[sector].totalChange += stock.changePercent || 0;
            sectorMap[sector].count += 1;
        });
        return Object.entries(sectorMap)
            .map(([sector, data]) => ({
                sector,
                avgChange: data.totalChange / data.count
            }))
            .filter(item => item.sector !== 'Others')
            .sort((a, b) => b.avgChange - a.avgChange);
    }, [stocks, isLoading]);

    const topGainers = useMemo(() => isLoading ? [] : [...stocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5), [stocks, isLoading]);
    const topLosers = useMemo(() => isLoading ? [] : [...stocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5), [stocks, isLoading]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="card p-5 lg:col-span-2">
                    <Skeleton width={150} height={20} className="mb-4" />
                    <div className="space-y-4">
                        <Skeleton height={24} width="100%" />
                        <Skeleton height={24} width="90%" />
                        <Skeleton height={24} width="85%" />
                    </div>
                </div>
                <div className="card p-5">
                    <Skeleton width={100} height={20} className="mb-4" />
                    <div className="space-y-6">
                        <div>
                            <Skeleton width={80} height={16} className="mb-2" />
                            <div className="space-y-2">
                                <Skeleton height={20} />
                                <Skeleton height={20} />
                                <Skeleton height={20} />
                            </div>
                        </div>
                        <div>
                            <Skeleton width={80} height={16} className="mb-2" />
                            <div className="space-y-2">
                                <Skeleton height={20} />
                                <Skeleton height={20} />
                                <Skeleton height={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Sector Performance */}
            <div className="glass-card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Sector Performance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sectorPerformance.map((item) => (
                        <div key={item.sector} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.sector}</span>
                                <span className={`text-xs font-bold ${item.avgChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {item.avgChange > 0 ? '+' : ''}{item.avgChange.toFixed(2)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${item.avgChange >= 0 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'}`}
                                    style={{ width: `${Math.max(Math.min(Math.abs(item.avgChange) * 20, 100), 5)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Movers */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Top Movers</h3>

                <div className="mb-6">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                        <span>🚀</span> Top Gainers
                    </p>
                    <div className="space-y-2">
                        {topGainers.map((stock) => (
                            <div 
                                key={stock.instrumentKey} 
                                className={`flex justify-between text-sm py-1 border-b border-gray-100 dark:border-slate-800 last:border-0 px-1 rounded transition-colors ${onStockClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50' : ''}`}
                                onClick={() => onStockClick?.(stock)}
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                        <span>📉</span> Top Losers
                    </p>
                    <div className="space-y-2">
                        {topLosers.map((stock) => (
                            <div 
                                key={stock.instrumentKey} 
                                className={`flex justify-between text-sm py-1 border-b border-gray-100 dark:border-slate-800 last:border-0 px-1 rounded transition-colors ${onStockClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50' : ''}`}
                                onClick={() => onStockClick?.(stock)}
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
