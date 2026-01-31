interface PerformanceMetricsProps {
    portfolio: {
        totalValue: number;
        totalInvested: number;
        totalPnL: number;
        totalPnLPercent: number;
    };
    todaysPnL: {
        pnl: number;
        pnlPercent: number;
    };
    holdingsCount: number;
}

export const PerformanceMetrics = ({ portfolio, todaysPnL, holdingsCount }: PerformanceMetricsProps) => {
    const metrics = [
        {
            label: 'Total Invested',
            value: `₹${portfolio.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            label: 'Current Value',
            value: `₹${portfolio.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            label: 'Total P&L',
            value: `${portfolio.totalPnL >= 0 ? '+' : ''}₹${portfolio.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subValue: `(${portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnLPercent.toFixed(2)}%)`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: portfolio.totalPnL >= 0 ? 'text-profit' : 'text-loss',
            bgColor: portfolio.totalPnL >= 0 ? 'bg-profit/10' : 'bg-loss/10',
        },
        {
            label: "Today's P&L",
            value: `${todaysPnL.pnl >= 0 ? '+' : ''}₹${todaysPnL.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subValue: `(${todaysPnL.pnl >= 0 ? '+' : ''}${todaysPnL.pnlPercent.toFixed(2)}%)`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: todaysPnL.pnl >= 0 ? 'text-profit' : 'text-loss',
            bgColor: todaysPnL.pnl >= 0 ? 'bg-profit/10' : 'bg-loss/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <div key={index} className="card p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs text-text-secondary mb-1">{metric.label}</p>
                            <p className={`text-xl font-bold ${metric.color}`}>
                                {metric.value}
                            </p>
                            {metric.subValue && (
                                <p className={`text-xs font-medium mt-0.5 ${metric.color}`}>
                                    {metric.subValue}
                                </p>
                            )}
                        </div>
                        <div className={`${metric.bgColor} ${metric.color} p-2 rounded-lg`}>
                            {metric.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
