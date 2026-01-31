import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint, PortfolioTimeframe, getHistoryByTimeframe } from '../services/portfolioHistory';

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
        <div className="card p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Portfolio Performance</h3>

                {/* Timeframe Selector */}
                <div className="flex space-x-1">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2 py-1 text-xs font-medium rounded transition ${timeframe === tf
                                    ? 'bg-primary text-white'
                                    : 'text-text-secondary hover:bg-surface-hover'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor={isPositive ? '#00d09c' : '#eb5b3c'}
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor={isPositive ? '#00d09c' : '#eb5b3c'}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#9e9e9e"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#9e9e9e"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={isPositive ? '#00d09c' : '#eb5b3c'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
