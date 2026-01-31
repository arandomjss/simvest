interface TopGainersLosersProps {
    holdings: any[];
}

export const TopGainersLosers = ({ holdings }: TopGainersLosersProps) => {
    // Calculate P&L for each holding
    const holdingsWithPnL = holdings.map(holding => ({
        ...holding,
        pnl: holding.currentValue - holding.investedValue,
        pnlPercent: ((holding.currentValue - holding.investedValue) / holding.investedValue) * 100,
    }));

    // Sort by P&L percentage
    const sorted = [...holdingsWithPnL].sort((a, b) => b.pnlPercent - a.pnlPercent);

    // Get top 3 gainers and losers
    const topGainers = sorted.slice(0, 3).filter(h => h.pnl > 0);
    const topLosers = sorted.slice(-3).reverse().filter(h => h.pnl < 0);

    const renderStock = (holding: any, isGainer: boolean) => (
        <div key={holding.symbol} className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isGainer ? 'bg-profit' : 'bg-loss'}`} />
                <span className="text-sm font-medium text-text-primary">{holding.symbol}</span>
            </div>
            <div className="text-right">
                <p className={`text-sm font-semibold ${isGainer ? 'text-profit' : 'text-loss'}`}>
                    {isGainer ? '+' : ''}₹{holding.pnl.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </p>
                <p className={`text-xs ${isGainer ? 'text-profit' : 'text-loss'}`}>
                    ({isGainer ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                </p>
            </div>
        </div>
    );

    if (holdings.length === 0) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Top Gainers & Losers</h3>
                <div className="text-center text-text-secondary py-8">
                    No holdings to display
                </div>
            </div>
        );
    }

    return (
        <div className="card p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Gainers & Losers</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Gainers */}
                <div>
                    <h4 className="text-sm font-semibold text-profit mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Top Gainers
                    </h4>
                    {topGainers.length > 0 ? (
                        <div className="space-y-1">
                            {topGainers.map(holding => renderStock(holding, true))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary py-4">No gainers</p>
                    )}
                </div>

                {/* Top Losers */}
                <div>
                    <h4 className="text-sm font-semibold text-loss mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Top Losers
                    </h4>
                    {topLosers.length > 0 ? (
                        <div className="space-y-1">
                            {topLosers.map(holding => renderStock(holding, false))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary py-4">No losers</p>
                    )}
                </div>
            </div>
        </div>
    );
};
