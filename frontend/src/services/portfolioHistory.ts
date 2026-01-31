export interface PortfolioHistoryPoint {
    date: string;
    value: number;
    invested: number;
    pnl: number;
    pnlPercent: number;
}

export type PortfolioTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

/**
 * Generate mock portfolio history data
 */
export const generatePortfolioHistory = (
    currentValue: number,
    invested: number,
    days: number = 365
): PortfolioHistoryPoint[] => {
    const history: PortfolioHistoryPoint[] = [];
    const now = new Date();

    // Start from invested amount and work forward
    let value = invested;
    const dailyVolatility = 0.015; // 1.5% daily volatility
    const overallGrowth = (currentValue - invested) / days; // Distribute growth over days

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Add growth trend + random volatility
        const randomChange = (Math.random() - 0.5) * 2 * dailyVolatility * value;
        value += overallGrowth + randomChange;

        // Ensure value doesn't go below 50% of invested
        value = Math.max(value, invested * 0.5);

        const pnl = value - invested;
        const pnlPercent = (pnl / invested) * 100;

        history.push({
            date: date.toISOString().split('T')[0],
            value: parseFloat(value.toFixed(2)),
            invested,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        });
    }

    // Ensure last point matches current value
    if (history.length > 0) {
        history[history.length - 1].value = currentValue;
        history[history.length - 1].pnl = currentValue - invested;
        history[history.length - 1].pnlPercent = ((currentValue - invested) / invested) * 100;
    }

    return history;
};

/**
 * Filter history by timeframe
 */
export const getHistoryByTimeframe = (
    history: PortfolioHistoryPoint[],
    timeframe: PortfolioTimeframe
): PortfolioHistoryPoint[] => {
    if (timeframe === 'ALL' || history.length === 0) {
        return history;
    }

    const now = new Date();
    let daysBack: number;

    switch (timeframe) {
        case '1D':
            daysBack = 1;
            break;
        case '1W':
            daysBack = 7;
            break;
        case '1M':
            daysBack = 30;
            break;
        case '3M':
            daysBack = 90;
            break;
        case '1Y':
            daysBack = 365;
            break;
        default:
            return history;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return history.filter(point => new Date(point.date) >= cutoffDate);
};

/**
 * Calculate performance metrics from history
 */
export const calculatePerformanceMetrics = (
    history: PortfolioHistoryPoint[],
    timeframe: PortfolioTimeframe
) => {
    const filteredHistory = getHistoryByTimeframe(history, timeframe);

    if (filteredHistory.length < 2) {
        return {
            startValue: 0,
            endValue: 0,
            change: 0,
            changePercent: 0,
        };
    }

    const startValue = filteredHistory[0].value;
    const endValue = filteredHistory[filteredHistory.length - 1].value;
    const change = endValue - startValue;
    const changePercent = (change / startValue) * 100;

    return {
        startValue,
        endValue,
        change,
        changePercent,
    };
};

/**
 * Get today's P&L from history
 */
export const getTodaysPnL = (history: PortfolioHistoryPoint[]) => {
    if (history.length < 2) {
        return { pnl: 0, pnlPercent: 0 };
    }

    const today = history[history.length - 1];
    const yesterday = history[history.length - 2];

    const pnl = today.value - yesterday.value;
    const pnlPercent = (pnl / yesterday.value) * 100;

    return {
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    };
};
