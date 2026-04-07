import { useMemo } from 'react';
import { Order } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StrategyAnalyticsProps {
    orders: Order[];
}

export const StrategyAnalytics = ({ orders }: StrategyAnalyticsProps) => {
    const analytics = useMemo(() => {
        if (!orders || orders.length === 0) return null;

        const strategyStats: Record<string, {
            count: number,
            wins: number,
            losses: number,
            totalPnl: number,
            totalVolume: number
        }> = {};

        let totalWins = 0;
        let totalLosses = 0;
        let totalPnl = 0;
        
        // Track the "average price" of positions to calculate realized PnL
        const activePositions: Record<string, { qty: number, avgPrice: number, strategy: string }> = {};

        // Process orders chronologically (assuming they come newest first, we reverse them)
        const chronologicalOrders = [...orders].reverse();

        chronologicalOrders.forEach(order => {
            if (order.status !== 'EXECUTED') return;
            
            const strategy = order.strategy || 'Uncategorized';
            const cost = order.execution_price * order.quantity;

            if (!strategyStats[strategy]) {
                strategyStats[strategy] = { count: 0, wins: 0, losses: 0, totalPnl: 0, totalVolume: 0 };
            }

            strategyStats[strategy].count += 1;
            strategyStats[strategy].totalVolume += cost;

            // Simplified Realized PnL Calculation (FIFO-ish / Avg Cost approximation)
            // For a perfect journal, we'd need exact trade linkages, but since it's a paper trading app, we approximate:
            if (order.type === 'BUY') {
                 const currentPos = activePositions[order.instrument_key] || { qty: 0, avgPrice: 0, strategy };
                 const newQty = currentPos.qty + order.quantity;
                 const newAvgPrice = ((currentPos.qty * currentPos.avgPrice) + cost) / newQty;
                 activePositions[order.instrument_key] = { qty: newQty, avgPrice: newAvgPrice, strategy };
            } else if (order.type === 'SELL') {
                 const currentPos = activePositions[order.instrument_key];
                 if (currentPos) {
                     // Realized PnL = (Sell Price - Avg Buy Price) * Qty Sold
                     const realizedPnl = (order.execution_price - currentPos.avgPrice) * order.quantity;
                     
                     // Attribute the PnL to the strategy used for the SELL (or fallback to the buy strategy if we want)
                     // Here we attribute to the current strategy tagged on the SELL order.
                     strategyStats[strategy].totalPnl += realizedPnl;
                     totalPnl += realizedPnl;

                     if (realizedPnl > 0) {
                         strategyStats[strategy].wins += 1;
                         totalWins += 1;
                     } else if (realizedPnl < 0) {
                         strategyStats[strategy].losses += 1;
                         totalLosses += 1;
                     }

                     // Decrease position
                     currentPos.qty -= order.quantity;
                 }
            }
        });

        const strategies = Object.entries(strategyStats)
            .map(([name, stats]) => ({
                name,
                ...stats,
                winRate: stats.wins + stats.losses > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0
            }))
            .sort((a, b) => b.totalPnl - a.totalPnl);

        const overallWinRate = totalWins + totalLosses > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;

        return {
            strategies,
            totalPnl,
            overallWinRate,
            totalTrades: chronologicalOrders.length,
            closedTrades: totalWins + totalLosses
        };

    }, [orders]);

    if (!analytics || analytics.strategies.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 text-center shadow-sm">
                <div className="inline-flex w-12 h-12 bg-gray-50 dark:bg-slate-700/50 rounded-full items-center justify-center text-xl mb-3">📊</div>
                <h3 className="text-gray-900 dark:text-white font-bold mb-1">No Strategy Data Yet</h3>
                <p className="text-xs text-gray-500">Place trades using strategy tags to see your performance breakdown here.</p>
            </div>
        );
    }

    const labels = analytics.strategies.map(s => s.name);
    const data = analytics.strategies.map(s => s.count);
    const backgroundColor = [
        '#8b5cf6', // purple-500
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#ec4899', // pink-500
        '#64748b', // slate-500
    ];

    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor,
                borderWidth: 0,
            },
        ],
    };

    const formatCurrency = (val: number) => {
        return `₹${val.toFixed(2)}`;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-primary">🧠</span> Strategy Analytics
                </h3>
            </div>
            
            <div className="p-5 flex-1 flex flex-col lg:flex-row gap-6">
                
                {/* Left Side: Summary & Chart */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    {/* High Level Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Total Signals Checked</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                {analytics.totalTrades}
                            </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Overall Win Rate</span>
                            <span className={`text-xl font-bold leading-none ${analytics.overallWinRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {analytics.overallWinRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    
                    {/* Chart visually showing usage */}
                    <div className="flex-1 min-h-[160px] flex justify-center items-center relative">
                        <Doughnut 
                            data={chartData} 
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#1e293b',
                                        padding: 10,
                                        cornerRadius: 8,
                                        bodyFont: { size: 12, family: 'Inter' }
                                    }
                                },
                                cutout: '75%',
                            }} 
                        />
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Realized PnL</span>
                            <span className={`text-base font-bold ${analytics.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {analytics.totalPnl >= 0 ? '+' : ''}{formatCurrency(analytics.totalPnl)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Breakdown List */}
                <div className="lg:w-2/3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Performance By Strategy</h4>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {analytics.strategies.map((strategy, idx) => (
                            <div key={idx} className="flex flex-col bg-gray-50 dark:bg-slate-700/20 p-3 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-2 h-2 rounded-full" 
                                            style={{ backgroundColor: backgroundColor[idx % backgroundColor.length] }}
                                        />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{strategy.name}</span>
                                        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] text-gray-600 dark:text-gray-300 font-mono">
                                            {strategy.count} trades
                                        </span>
                                    </div>
                                    <span className={`text-sm font-bold font-mono ${strategy.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {strategy.totalPnl >= 0 ? '+' : ''}{formatCurrency(strategy.totalPnl)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase">Win Rate</span>
                                        <span className={`font-semibold ${strategy.winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : strategy.winRate > 0 ? 'text-amber-500' : ''}`}>
                                            {strategy.winRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase">W / L</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{strategy.wins} / {strategy.losses}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
