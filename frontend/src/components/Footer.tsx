import { useEffect, useState } from 'react';

interface FooterData {
    copyright: string;
    links: { label: string; url: string }[];
    social: { platform: string; url: string }[];
}

export const Footer = () => {
    const [data, setData] = useState<FooterData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFooterData = async () => {
            try {
                const response = await fetch('/footer_data.xml');
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');

                const copyright = xmlDoc.querySelector('copyright')?.textContent || '';

                const linkNodes = xmlDoc.querySelectorAll('links link');
                const links = Array.from(linkNodes).map(node => ({
                    label: node.querySelector('label')?.textContent || '',
                    url: node.querySelector('url')?.textContent || ''
                }));

                const socialNodes = xmlDoc.querySelectorAll('social item');
                const social = Array.from(socialNodes).map(node => ({
                    platform: node.querySelector('platform')?.textContent || '',
                    url: node.querySelector('url')?.textContent || ''
                }));

                setData({ copyright, links, social });
            } catch (error) {
                console.error('Failed to load footer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFooterData();
    }, []);

    if (loading || !data) return null;

    return (
        <footer className="mt-auto py-6 border-t border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {data.copyright}
                    </div>

                    <div className="flex flex-wrap gap-6 justify-center">
                        {data.links.map((link, index) => (
                            <a
                                key={index}
                                href={link.url}
                                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        {data.social.map((item, index) => (
                            <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <span className="sr-only">{item.platform}</span>
                                {/* Simple icons based on platform name could be added here, using text for now */}
                                <span className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
                                    {item.platform}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
