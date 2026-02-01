import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint, PortfolioTimeframe, getHistoryByTimeframe } from '../services/portfolioHistory';
import { colors } from '../styles/colors';

interface PortfolioPerformanceChartProps {
    history: PortfolioHistoryPoint[];
}

export const PortfolioPerformanceChart = ({ history }: PortfolioPerformanceChartProps) => {
    const [timeframe, setTimeframe] = useState<PortfolioTimeframe>('1M');

    const timeframes: PortfolioTimeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
    const filteredHistory = getHistoryByTimeframe(history, timeframe);

    // Format data for chart
    const chartData = filteredHistory.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        value: point.value,
        pnl: point.pnl,
        invested: point.invested,
    }));

    // Determine if overall P&L is positive
    const isPositive = filteredHistory.length > 0
        ? filteredHistory[filteredHistory.length - 1].pnl >= 0
        : true;

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const pnl = data.value - data.invested;
            const pnlPercent = ((pnl / data.invested) * 100).toFixed(2);
            const isPnlPositive = pnl >= 0;

            return (
                <div className="bg-surface border border-border rounded-lg shadow-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">{data.date}</p>
                    <p className="text-sm font-semibold text-text-primary">
                        ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-medium ${isPnlPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPnlPositive ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {' '}({isPnlPositive ? '+' : ''}{pnlPercent}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full p-2">
            {/* Header / Controls */}
            <div className="flex justify-end mb-4">
                <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timeframe === tf
                                ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor={isPositive ? colors.success.DEFAULT : colors.danger.DEFAULT}
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={isPositive ? colors.success.DEFAULT : colors.danger.DEFAULT}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? colors.success.DEFAULT : colors.danger.DEFAULT}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
