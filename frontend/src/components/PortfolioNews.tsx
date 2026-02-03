import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

interface PortfolioNewsProps {
    holdings: any[];
}

interface NewsItem {
    id: string;
    title: string;
    source: string;
    time: string;
    link: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    symbols: string[];
}

export const PortfolioNews = ({ holdings }: PortfolioNewsProps) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchNews = async () => {
        setIsLoading(true);
        try {
            // Pick top 3 holdings by value (or just first 3 if value not calculated yet)
            // Holdings usually have avgPrice * quantity.
            // Let's just take top 3 for now.
            const topSymbols = holdings
                .sort((a, b) => (b.quantity * b.avgPrice) - (a.quantity * a.avgPrice))
                .slice(0, 3)
                .map(h => h.symbol);

            // Strictly specific to holdings
            const symbolsToFetch = topSymbols;

            if (symbolsToFetch.length === 0) {
                setNews([]);
                setIsLoading(false);
                return;
            }

            // Fetch in parallel
            const promises = symbolsToFetch.map(sym => apiService.getCompanyNews(sym));
            const results = await Promise.all(promises);

            // Flatten and deduplicate by ID
            const allNews = results.flat();
            const uniqueNews = Array.from(new Map(allNews.map(item => [item.id, item])).values());

            // Sort by time (newest first)
            uniqueNews.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            setNews(uniqueNews);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch portfolio news", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initially, and whenever holdings drastically change (length changes)
        fetchNews();
    }, [holdings.length]);

    if (isLoading && news.length === 0) {
        return (
            <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Portfolio News</h3>
                </div>
                <div className="flex-1 flex flex-col gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-4 w-3/4 bg-gray-100 dark:bg-slate-700 rounded"></div>
                            <div className="h-3 w-1/4 bg-gray-100 dark:bg-slate-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Portfolio News</h3>
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 opacity-60">
                    <div className="mb-2 text-2xl">📰</div>
                    <p className="text-xs text-center">No news found for your portfolio.</p>
                    <button onClick={fetchNews} className="mt-3 text-xs text-primary underline">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Portfolio News
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 hidden sm:inline">
                        Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <button onClick={fetchNews} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Refresh News">
                        <RefreshCw className={`w-3 h-3 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 divide-y divide-gray-50 dark:divide-slate-700/50 custom-scrollbar">
                {news.map(item => (
                    <a
                        key={item.id}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                        <div className="flex justify-between items-start gap-3 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {item.title}
                            </h4>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-[100px]">{item.source}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};
