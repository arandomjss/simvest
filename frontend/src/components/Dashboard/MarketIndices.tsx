import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Stock } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MarketIndices = () => {
    const [indices, setIndices] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const data = await apiService.getIndices();
                if (data) {
                    setIndices(data);
                }
            } catch (error) {
                console.error("Failed to fetch indices", error);
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
                const colorClass = isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400';

                return (
                    <div key={index.symbol} className="glass-card p-4 flex flex-col justify-between relative overflow-hidden group">
                        {/* Decorative Background Graph */}
                        <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12`}>
                            {isPositive ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
                        </div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{index.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {index.price?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end ${colorClass}`}>
                                <div className="flex items-center gap-1 font-bold text-sm">
                                    {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
                                    <span>{Math.abs(index.change || 0).toFixed(2)}</span>
                                </div>
                                <span className={`text-xs font-medium rounded px-1.5 py-0.5 mt-1 border ${isPositive
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : isNegative
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                    {isPositive ? '+' : ''}{(index.changePercent || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
