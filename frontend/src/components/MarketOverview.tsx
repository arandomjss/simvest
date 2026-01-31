import { useMemo } from 'react';
import { Stock } from '../types';
import { getSector } from '../utils/sectorUtils';

interface MarketOverviewProps {
    stocks: Stock[];
}

export const MarketOverview = ({ stocks }: MarketOverviewProps) => {

    // Calculate Sector Performance
    const sectorPerformance = useMemo(() => {
        const sectorMap: Record<string, { totalChange: number; count: number }> = {};

        stocks.forEach(stock => {
            const sector = getSector(stock.symbol);
            if (!sectorMap[sector]) sectorMap[sector] = { totalChange: 0, count: 0 };
            sectorMap[sector].totalChange += stock.changePercent || 0;
            sectorMap[sector].count += 1;
        });

        return Object.entries(sectorMap)
            .map(([sector, data]) => ({
                sector,
                avgChange: data.totalChange / data.count
            }))
            .sort((a, b) => b.avgChange - a.avgChange); // Best to worst
    }, [stocks]);

    // Top Movers
    const topGainers = useMemo(() => [...stocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 3), [stocks]);
    const topLosers = useMemo(() => [...stocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 3), [stocks]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Sector Performance */}
            <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Sector Performance</h3>
                <div className="space-y-3">
                    {sectorPerformance.map((item) => (
                        <div key={item.sector} className="flex items-center text-sm">
                            <span className="w-24 font-medium text-text-primary">{item.sector}</span>
                            <div className="flex-1 h-2 bg-background mx-3 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${item.avgChange >= 0 ? 'bg-profit' : 'bg-loss'}`}
                                    style={{ width: `${Math.min(Math.abs(item.avgChange) * 10, 100)}%` }} // Scale visualization
                                />
                            </div>
                            <span className={`w-16 text-right font-medium ${item.avgChange >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {item.avgChange > 0 ? '+' : ''}{item.avgChange.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Movers */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Top Movers</h3>

                <div className="mb-4">
                    <p className="text-xs font-semibold text-profit mb-2">🚀 Top Gainers</p>
                    <div className="space-y-2">
                        {topGainers.map(stock => (
                            <div key={stock.instrumentKey} className="flex justify-between text-sm">
                                <span className="text-text-primary">{stock.symbol}</span>
                                <span className="text-profit">+{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-loss mb-2">📉 Top Losers</p>
                    <div className="space-y-2">
                        {topLosers.map(stock => (
                            <div key={stock.instrumentKey} className="flex justify-between text-sm">
                                <span className="text-text-primary">{stock.symbol}</span>
                                <span className="text-loss">{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
