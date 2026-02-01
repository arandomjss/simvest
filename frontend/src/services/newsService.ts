export interface NewsItem {
    id: string; // Changed to string for flexibility
    title: string;
    time: string;
    category: string;
    source: string;
    url: string;
}

const RSS_FEED_URL = 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en';
const RSS2JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED_URL)}`;
const CACHE_KEY = 'market_news_cache_v4';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const FALLBACK_NEWS: NewsItem[] = [
    { id: '1', title: "RBI keeps repo rate unchanged at 6.5%", time: "10:30 AM", category: "Macro", source: "Reserve Bank", url: "#" },
    { id: '2', title: "Nifty hits fresh all-time high led by IT stocks", time: "11:15 AM", category: "Market", source: "MoneyControl", url: "#" },
    { id: '3', title: "TCS announces buyback at premium", time: "12:00 PM", category: "Earnings", source: "CNBC TV18", url: "#" },
    { id: '4', title: "Brent crude falls below $80/barrel", time: "1:45 PM", category: "Global", source: "Reuters", url: "#" },
    { id: '5', title: "Rupee strengthens against US Dollar", time: "2:30 PM", category: "Forex", source: "Mint", url: "#" },
];

export const newsService = {
    getMarketNews: async (): Promise<NewsItem[]> => {
        try {
            // Check Cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION && data.length > 0) {
                    return data;
                }
            }

            // Fetch Live Data (RSS via JSON Proxy)
            try {
                const response = await fetch(RSS2JSON_API);

                if (!response.ok) {
                    throw new Error(`RSS Proxy Error: ${response.status}`);
                }

                const data = await response.json();

                if (data.status !== 'ok') {
                    throw new Error(data.message || 'Failed to fetch RSS feed');
                }

                if (!data.items || data.items.length === 0) {
                    console.warn("RSS returned 0 items. Using Fallback.");
                    return FALLBACK_NEWS;
                }

                // Transform Data
                const articles: NewsItem[] = data.items.map((item: any, index: number) => {
                    // Extract source from title if possible (Google News format: "Title - Source")
                    const titleParts = item.title.split(' - ');
                    const source = titleParts.length > 1 ? titleParts.pop() : 'Google News';
                    const title = titleParts.join(' - ');

                    return {
                        id: item.guid || item.link || `news-${index}`,
                        title: title,
                        time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        category: 'Business',
                        source: source,
                        url: item.link
                    };
                }).slice(0, 10);

                // Update Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: articles,
                    timestamp: Date.now()
                }));

                return articles;

            } catch (fetchError) {
                console.warn("RSS Fetch Failed, using Fallback:", fetchError);
                return FALLBACK_NEWS;
            }

        } catch (error) {
            console.error("News Service Critical Error:", error);
            return FALLBACK_NEWS;
        }
    }
};
