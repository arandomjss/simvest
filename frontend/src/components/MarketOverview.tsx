import { useMemo } from 'react';
import { Stock } from '../types';
import { getSector } from '../utils/sectorUtils';
import { Skeleton } from './common/Skeleton';

interface MarketOverviewProps {
    stocks: Stock[];
    isLoading?: boolean;
}

export const MarketOverview = ({ stocks, isLoading = false }: MarketOverviewProps) => {

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

    const topGainers = useMemo(() => isLoading ? [] : [...stocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 3), [stocks, isLoading]);
    const topLosers = useMemo(() => isLoading ? [] : [...stocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 3), [stocks, isLoading]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sector Performance */}
            <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Sector Performance</h3>
                <div className="space-y-3">
                    {sectorPerformance.map((item) => (
                        <div key={item.sector} className="flex items-center text-sm">
                            <span className="w-24 font-medium text-gray-900 dark:text-white">{item.sector}</span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 mx-3 rounded-full overflow-hidden">
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
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Top Movers</h3>

                <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">🚀 Top Gainers</p>
                    <div className="space-y-2">
                        {topGainers.map((stock) => (
                            <div key={stock.instrumentKey} className="flex justify-between text-sm">
                                <span className="text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">+{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">📉 Top Losers</p>
                    <div className="space-y-2">
                        {topLosers.map((stock) => (
                            <div key={stock.instrumentKey} className="flex justify-between text-sm">
                                <span className="text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className="text-red-600 dark:text-red-400">{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
