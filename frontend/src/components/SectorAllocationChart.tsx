import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SECTOR_MAP, SECTOR_COLORS } from '../utils/sectorUtils';

interface SectorAllocation {
    sector: string;
    value: number;
    percentage: number;
}

interface SectorAllocationChartProps {
    holdings: any[];
}

export const SectorAllocationChart = ({ holdings }: SectorAllocationChartProps) => {
    // Calculate sector allocation
    const sectorMap = new Map<string, number>();
    let totalValue = 0;

    holdings.forEach(holding => {
        const sector = SECTOR_MAP[holding.symbol] || 'Others';
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

    // Custom label
    const renderLabel = (entry: any) => {
        return `${entry.percentage}%`;
    };

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
            <div className="card p-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Sector Allocation</h3>
                <div className="flex items-center justify-center h-64 text-text-secondary">
                    No holdings to display
                </div>
            </div>
        );
    }

    return (
        <div className="card p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Sector Allocation</h3>

            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={SECTOR_COLORS[entry.name] || SECTOR_COLORS['Others']}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                            <span className="text-xs text-text-secondary">
                                {value} ({entry.payload.percentage}%)
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
