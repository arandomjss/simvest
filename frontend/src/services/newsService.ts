import api from './api';

export interface NewsItem {
    id: string;
    title: string;
    time: string;
    category: string;
    source: string;
    url: string;
}

export const newsService = {
    getMarketNews: async (): Promise<NewsItem[]> => {
        try {
            const response = await api.get('/api/market/news');
            const newsData = response.data.news; // Backend returns { news: [...] }

            // Transform if necessary or just return
            return newsData.map((item: any, idx: number) => ({
                id: `news-${idx}`,
                title: item.title,
                time: item.time,
                category: item.category || 'Business',
                source: item.source || 'Market',
                url: item.url
            }));

        } catch (error) {
            console.error("Failed to fetch news from backend:", error);
            return []; // Return empty on error
        }
    }
};
