import { Portfolio } from '../types';

interface PortfolioStripProps {
    portfolio: Portfolio | null;
}

export const PortfolioStrip = ({ portfolio }: PortfolioStripProps) => {
    if (!portfolio) {
        return (
            <div className="w-full h-12 bg-surface/40 border-b border-border flex items-center px-4 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded"></div>
            </div>
        );
    }

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '₹0.00';
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const formatPercent = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '0.00%';
        return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
    };

    return (
        <div className="w-full h-14 bg-gray-100 dark:bg-slate-800 backdrop-blur-md border-b border-gray-300 dark:border-slate-600 flex items-center justify-between px-6 sticky top-0 z-20">
            {/* Left: Main Metrics */}
            <div className="flex items-center gap-8">
                <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">Net Worth</span>
                    <span className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        {formatCurrency(portfolio.totalValue)}
                    </span>
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>

                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">P&L</span>
                    <div className={`flex items-baseline gap-2 ${portfolio.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span className="font-mono font-medium">{formatCurrency(Math.abs(portfolio.totalPnL))}</span>
                        <span className="text-xs font-mono">({formatPercent(portfolio.totalPnLPercent)})</span>
                    </div>
                </div>
            </div>

            {/* Right: Balance & Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">Available</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(portfolio.cashBalance || 0)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold">Invested</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(portfolio.totalInvestment)}
                    </span>
                </div>

                <div className="h-4 w-4 rounded-full bg-success/20 border border-success flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};
