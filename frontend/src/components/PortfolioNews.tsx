import { useMemo } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface PortfolioNewsProps {
    holdings: any[];
}

const MOCK_NEWS = [
    {
        id: 1,
        title: "Reliance Industries to acquire majority stake in new solar venture",
        source: "Economic Times",
        time: "2h ago",
        sentiment: "positive",
        symbols: ["RELIANCE"]
    },
    {
        id: 2,
        title: "TCS misses revenue estimates, stock falls 2%",
        source: "Moneycontrol",
        time: "4h ago",
        sentiment: "negative",
        symbols: ["TCS"]
    },
    {
        id: 3,
        title: "HDFC Bank announces interim dividend of ₹15",
        source: "Mint",
        time: "5h ago",
        sentiment: "positive",
        symbols: ["HDFCBANK"]
    },
    {
        id: 4,
        title: "Global markets rally as inflation data cools down",
        source: "Bloomberg",
        time: "6h ago",
        sentiment: "neutral",
        symbols: ["INFY", "WIPRO", "TECHM"]
    },
    {
        id: 5,
        title: "Auto sector sales drop due to semiconductor shortage",
        source: "CNBC TV18",
        time: "1d ago",
        sentiment: "negative",
        symbols: ["TATAMOTORS", "MARUTI"]
    },
    {
        id: 6,
        title: "Adani Green secures new project in Gujarat",
        source: "Business Standard",
        time: "1d ago",
        sentiment: "positive",
        symbols: ["ADANIGREEN", "ADANIENT"]
    }
];

export const PortfolioNews = ({ holdings }: PortfolioNewsProps) => {

    const myNews = useMemo(() => {
        if (!holdings || holdings.length === 0) return [];
        const mySymbols = new Set(holdings.map(h => h.symbol));
        // Filter news that matches at least one held symbol
        return MOCK_NEWS.filter(news => news.symbols.some(s => mySymbols.has(s)));
    }, [holdings]);

    if (myNews.length === 0) {
        return (
            <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Portfolio News</h3>
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 opacity-60">
                    <div className="mb-2 text-2xl">📰</div>
                    <p className="text-xs text-center">No recent news for your holdings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Portfolio News</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Live Updates</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar max-h-[300px]">
                {myNews.map(item => (
                    <div key={item.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-600">
                        <div className="flex justify-between items-start gap-3 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {item.title}
                            </h4>
                            <div className="shrink-0 pt-0.5">
                                {item.sentiment === 'positive' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                                {item.sentiment === 'negative' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                                {item.sentiment === 'neutral' && <AlertCircle className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.source}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-[10px] text-gray-400">{item.time}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
