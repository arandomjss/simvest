import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SECTOR_MAP, SECTOR_COLORS } from '../utils/sectorUtils';
import { Stock } from '../types';

interface SectorAllocation {
    sector: string;
    value: number;
    percentage: number;
}

interface SectorAllocationChartProps {
    holdings: any[];
    stocks: Stock[];
}

export const SectorAllocationChart = ({ holdings, stocks = [] }: SectorAllocationChartProps) => {
    // Calculate sector allocation
    const sectorMap = new Map<string, number>();
    let totalValue = 0;

    holdings.forEach(holding => {
        const stock = stocks.find(s => s.symbol === holding.symbol || s.instrumentKey === holding.instrumentKey);
        const sector = stock?.sector || SECTOR_MAP[holding.symbol] || 'Others';
        const value = holding.currentValue || 0;
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
        totalValue += value;
    });

    // Convert to array and calculate percentages
    const sectorData: SectorAllocation[] = Array.from(sectorMap.entries())
        .map(([sector, value]) => ({
            sector,
            value,
            percentage: parseFloat(((value / totalValue) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.value - a.value);

    // Prepare data for pie chart
    const chartData = sectorData.map(item => ({
        name: item.sector,
        value: item.value,
        percentage: item.percentage,
    }));



    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-surface border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-semibold text-text-primary">{data.name}</p>
                    <p className="text-xs text-text-secondary">
                        ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs font-medium text-primary">
                        {data.payload.percentage}% of portfolio
                    </p>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
                No data available
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={SECTOR_COLORS[entry.name] || SECTOR_COLORS['Others']}
                                className="stroke-white dark:stroke-slate-900 stroke-2"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
