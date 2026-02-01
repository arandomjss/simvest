import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Stock } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOCK_INDICES: Stock[] = [
    { symbol: '^NSEI', name: 'NIFTY 50', price: 21853.80, change: 156.20, changePercent: 0.72, instrumentKey: 'NIFTY50' },
    { symbol: '^BSESN', name: 'SENSEX', price: 72085.63, change: 490.50, changePercent: 0.69, instrumentKey: 'SENSEX' },
    { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 45963.15, change: -120.30, changePercent: -0.26, instrumentKey: 'BANKNIFTY' },
];

export const MarketIndices = () => {
    const [indices, setIndices] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const data = await apiService.getIndices();
                if (data && data.length > 0) {
                    setIndices(data);
                } else {
                    setIndices(MOCK_INDICES);
                }
            } catch (error) {
                console.error("Failed to fetch indices", error);
                setIndices(MOCK_INDICES);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIndices();
        // Optional: Poll every minute
        const interval = setInterval(fetchIndices, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-surface border border-border rounded-lg p-4">
                        <Skeleton width={100} height={20} className="mb-2" />
                        <Skeleton width={80} height={24} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {indices.map((index) => {
                const isPositive = (index.change || 0) > 0;
                const isNegative = (index.change || 0) < 0;
                const colorClass = isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-gray-500';

                return (
                    <div key={index.symbol} className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Decorative Background Graph */}
                        <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12`}>
                            {isPositive ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
                        </div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{index.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xl font-bold text-text-primary tracking-tight">
                                        {index.price?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end ${colorClass}`}>
                                <div className="flex items-center gap-1 font-bold text-sm">
                                    {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
                                    <span>{Math.abs(index.change || 0).toFixed(2)}</span>
                                </div>
                                <span className="text-xs font-medium bg-surface rounded px-1.5 py-0.5 mt-1 border border-border/50">
                                    {isPositive ? '+' : ''}{(index.changePercent || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        {/* Mini Bar */}
                        <div className="w-full bg-gray-200 h-1 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(Math.abs(index.changePercent || 0) * 50, 100)}%` }} // Scale visuals
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
