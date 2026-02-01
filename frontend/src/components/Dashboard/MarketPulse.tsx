import { useEffect, useState } from 'react';
import { newsService, NewsItem } from '../../services/newsService';
import { Skeleton } from '../common/Skeleton';

export const MarketPulse = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchNews = async () => {
            if (isMounted) setIsLoading(true);
            try {
                const data = await newsService.getMarketNews();
                if (isMounted) {
                    setNews(data);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch news", err);
                if (isMounted) setError("Failed to load live news.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchNews();

        // Refresh every 5 minutes (align with cache)
        const interval = setInterval(fetchNews, 300000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="glass-card h-full flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>📰</span> Market Pulse
                </h3>
                <span className="text-[10px] text-green-600 dark:text-green-400 animate-pulse font-medium">● LIVE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">{
                isLoading && news.length === 0 ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <Skeleton width={60} height={12} />
                                <Skeleton width="100%" height={16} />
                                <Skeleton width="80%" height={16} />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-700 dark:text-gray-400 p-4 text-center">
                        <span className="text-2xl mb-2">⚠️</span>
                        <p className="text-sm">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">Retry</button>
                    </div>
                ) : news.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary p-4 text-center">
                        <span className="text-2xl mb-2">📭</span>
                        <p className="text-sm">No news available.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {news.map((item) => (
                            <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 hover:bg-surface-hover transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        {item.source}
                                    </span>
                                    <span className="text-[10px] text-text-secondary">{item.time}</span>
                                </div>
                                <h4 className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {item.title}
                                </h4>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
