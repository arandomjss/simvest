import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Stock } from '../../types';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';

interface MarketIndicesProps {
    onIndexClick?: (index: Stock) => void;
}

const INDEX_META: Record<string, { shortName: string; icon: string; description: string }> = {
    '^NSEI':    { shortName: 'NIFTY 50',    icon: '🇮🇳', description: 'NSE Large Cap Index' },
    '^BSESN':   { shortName: 'SENSEX',      icon: '📈',  description: 'BSE Top 30 Companies' },
    '^NSEBANK': { shortName: 'BANK NIFTY',  icon: '🏦',  description: 'Banking Sector Index' },
};

const RangeBar = ({ low, high, current, open }: { low: number; high: number; current: number; open: number }) => {
    if (!low || !high || high === low) return null;
    const range = high - low;
    const currentPct = ((current - low) / range) * 100;
    const openPct = ((open - low) / range) * 100;

    return (
        <div className="mt-3">
            <div className="flex justify-between text-[9px] text-gray-400 dark:text-slate-500 mb-1 font-mono">
                <span>L {low.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="text-[9px] text-gray-400">Day Range</span>
                <span>H {high.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="relative h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-visible">
                {/* Gradient fill from low to current */}
                <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 opacity-50"
                    style={{ width: `${currentPct}%` }}
                />
                {/* Open marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-400 dark:bg-slate-400 rounded-full"
                    style={{ left: `${openPct}%` }}
                    title={`Open: ${open.toLocaleString()}`}
                />
                {/* Current dot */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 shadow-md"
                    style={{
                        left: `${currentPct}%`,
                        transform: 'translateY(-50%) translateX(-50%)',
                        backgroundColor: current >= open ? '#10b981' : '#ef4444'
                    }}
                />
            </div>
        </div>
    );
};

export const MarketIndices = ({ onIndexClick }: MarketIndicesProps) => {
    const [indices, setIndices] = useState<(Stock & { high?: number; low?: number; open?: number; previousClose?: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchIndices = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const data = await apiService.getIndices();
            if (data) {
                setIndices(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch indices', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchIndices();
        const interval = setInterval(() => fetchIndices(true), 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
                        <div className="flex justify-between mb-3">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-gray-100 dark:bg-slate-700 rounded" />
                                <div className="h-6 w-28 bg-gray-100 dark:bg-slate-700 rounded" />
                            </div>
                            <div className="h-7 w-16 bg-gray-100 dark:bg-slate-700 rounded-lg" />
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mt-4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Market Indices</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                        LIVE
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {lastUpdated && (
                        <span>Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    )}
                    <button
                        onClick={() => fetchIndices(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3 h-3 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {indices.map((index) => {
                    const isPositive = (index.changePercent || 0) >= 0;
                    const meta = INDEX_META[index.symbol] || { shortName: index.name || index.symbol, icon: '📊', description: 'Market Index' };

                    const priceStr = (index.price || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    const changeAbs = Math.abs(index.change || 0).toFixed(2);
                    const changePercent = (index.changePercent || 0).toFixed(2);

                    return (
                        <div
                            key={index.symbol}
                            onClick={() => onIndexClick?.({ ...index, ltp: index.price, instrumentKey: index.instrumentKey || `NSE_EQ|${index.symbol}` })}
                            className={`
                                relative bg-white dark:bg-slate-800 rounded-xl border overflow-hidden transition-all duration-200 p-4
                                ${isPositive
                                    ? 'border-emerald-100 dark:border-emerald-900/30'
                                    : 'border-red-100 dark:border-red-900/30'}
                                ${onIndexClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}
                            `}
                        >
                            {/* Subtle background glow */}
                            <div className={`absolute inset-0 opacity-[0.03] ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                            {/* Top row: name + badge */}
                            <div className="flex items-start justify-between mb-2 relative">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-base">{meta.icon}</span>
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {meta.shortName}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500">{meta.description}</p>
                                </div>

                                {/* % Change Badge */}
                                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                                    isPositive
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                }`}>
                                    {isPositive
                                        ? <TrendingUp className="w-3 h-3" />
                                        : <TrendingDown className="w-3 h-3" />
                                    }
                                    {isPositive ? '+' : '-'}{changePercent}%
                                </div>
                            </div>

                            {/* Price + Abs change */}
                            <div className="flex items-end justify-between relative">
                                <div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight font-mono">
                                        {priceStr}
                                    </div>
                                    <div className={`text-xs font-semibold mt-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {isPositive ? '▲' : '▼'} {changeAbs} pts
                                    </div>
                                </div>

                                {/* Prev Close */}
                                <div className="text-right">
                                    <div className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Prev Close</div>
                                    <div className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">
                                        {(index.previousClose || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Day Range Bar */}
                            <RangeBar
                                low={index.low || 0}
                                high={index.high || 0}
                                current={index.price || 0}
                                open={index.open || 0}
                            />

                            {/* Open indicator row */}
                            {index.open && (
                                <div className="flex justify-between mt-2 text-[9px] text-gray-400 dark:text-slate-500">
                                    <span>Open: <span className="text-gray-600 dark:text-gray-400 font-semibold font-mono">
                                        {(index.open).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span></span>
                                    <span>│</span>
                                    <span>High: <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                                        {(index.high || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span></span>
                                    <span>│</span>
                                    <span>Low: <span className="text-red-500 dark:text-red-400 font-semibold font-mono">
                                        {(index.low || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span></span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
