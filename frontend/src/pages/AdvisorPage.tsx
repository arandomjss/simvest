import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { TradeAnalysis } from '../components/TradeAnalysis';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { apiService } from '../services/api';

export const AdvisorPage = () => {
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const { portfolio, fetchPortfolio } = usePortfolioStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(null);

    // Derived state to get the latest live data
    const selectedStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === selectedStockKey),
        [stocks, selectedStockKey]
    );

    useEffect(() => {
        fetchInstruments();
        fetchPortfolio();
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);

    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (selectedStock) {
                setProfile(null); // Clear previous
                try {
                    const data = await apiService.getCompanyProfile(selectedStock.symbol);
                    setProfile(data);
                } catch (e) {
                    console.error("Failed to load profile", e);
                }
            }
        };
        loadProfile();
    }, [selectedStock?.symbol]);

    // Filter stocks for the dropdown
    const filteredStocks = useMemo(() => {
        if (!searchTerm) return [];
        return stocks.filter(s =>
            s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [stocks, searchTerm]);

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL: SEARCH & CONTEXT (350px) */}
                <div className="w-[350px] flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>🧠</span> AI Analyst
                        </h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Symbol..."
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (!e.target.value) setSelectedStockKey(null);
                                }}
                            />
                            {searchTerm && !selectedStock && filteredStocks.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded shadow-lg z-20">
                                    {filteredStocks.map(stock => (
                                        <div
                                            key={stock.instrumentKey}
                                            onClick={() => {
                                                setSelectedStockKey(stock.instrumentKey);
                                                setSearchTerm(stock.symbol);
                                            }}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm text-gray-800 dark:text-gray-200 flex justify-between"
                                        >
                                            <span className="font-bold">{stock.symbol}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Analyze</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access / History (Mock for now) */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-3 uppercase">Market Leaders</p>
                        <div className="space-y-1">
                            {stocks.slice(0, 5).map(s => (
                                <div
                                    key={s.instrumentKey}
                                    onClick={() => {
                                        setSelectedStockKey(s.instrumentKey);
                                        setSearchTerm(s.symbol);
                                    }}
                                    className={`p-2 rounded border cursor-pointer transition ${selectedStockKey === s.instrumentKey ? 'bg-primary/5 border-primary' : 'bg-background border-transparent hover:border-border'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold ${selectedStockKey === s.instrumentKey ? 'text-primary' : 'text-text-primary'}`}>{s.symbol}</span>
                                        <span className={`text-xs ${(s.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>{(s.changePercent || 0).toFixed(2)}%</span>
                                    </div>
                                    <div className="text-[10px] text-text-secondary mt-1 truncate">{s.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: ANALYSIS CONTENT */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-900 flex flex-col min-w-0 overflow-y-auto">
                    {selectedStock ? (
                        <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Header & Stats */}
                            <div className="glass-card overflow-hidden">
                                {/* Title Row */}
                                <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                            {selectedStock.symbol}
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-gray-500">
                                                NSE
                                            </span>
                                        </h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedStock.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-mono font-semibold text-gray-900 dark:text-white">
                                            ₹{(selectedStock.ltp || 0).toFixed(2)}
                                        </div>
                                        <div className={`text-sm font-medium ${(selectedStock.change || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
                                            {(selectedStock.change || 0) >= 0 ? '+' : ''}{(selectedStock.change || 0).toFixed(2)} ({((selectedStock.changePercent || 0)).toFixed(2)}%)
                                        </div>
                                    </div>
                                </div>

                                {/* Key Stats Strip - Cleaner Look */}
                                <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 md:grid-cols-6 gap-y-4 gap-x-8">
                                    {/* Open */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Open</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">₹{selectedStock.open?.toFixed(2) || '-'}</span>
                                    </div>
                                    {/* High */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">High</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">₹{selectedStock.high?.toFixed(2) || '-'}</span>
                                    </div>
                                    {/* Low */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Low</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">₹{selectedStock.low?.toFixed(2) || '-'}</span>
                                    </div>
                                    {/* Prev Close */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Prv Close</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">₹{selectedStock.previousClose?.toFixed(2) || '-'}</span>
                                    </div>
                                    {/* Volume */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Volume</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">
                                            {selectedStock.volume ? (selectedStock.volume > 100000 ? `${(selectedStock.volume / 100000).toFixed(2)}L` : selectedStock.volume.toLocaleString()) : '-'}
                                        </span>
                                    </div>
                                    {/* Mkt Cap */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Mkt Cap</span>
                                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">
                                            {selectedStock.marketCap ? `₹${(selectedStock.marketCap / 10000000).toFixed(0)}Cr` : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Main Analysis Column (2/3 width) */}
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="glass-card p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="text-primary">🤖</span> AI Technical Verdict
                                        </h3>
                                        <TradeAnalysis
                                            stock={selectedStock}
                                            currentPrice={selectedStock.ltp || 0}
                                        />
                                    </div>

                                    {/* Company Profile Card */}
                                    {profile && (
                                        <div className="glass-card p-6 animate-in fade-in slide-in-from-bottom-4 delay-100">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <span>🏢</span> Company Profile
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                                {profile.longBusinessSummary || "No summary available."}
                                            </p>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Sector</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{profile.sector}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Industry</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{profile.industry}</div>
                                                </div>
                                                {profile.website && (
                                                    <div>
                                                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Website</div>
                                                        <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
                                                            {new URL(profile.website).hostname}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar Education */}
                                <div className="space-y-6">
                                    <div className="bg-surface border border-border rounded-lg p-5">
                                        <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                            <span>📚</span> Signal Logic
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs font-bold text-text-secondary mb-1">RSI (Relative Strength)</div>
                                                <p className="text-xs text-text-secondary leading-normal">
                                                    Measures momentum. &gt;70 is Overbought (Sell risk), &lt;30 is Oversold (Buy opportunity).
                                                </p>
                                            </div>
                                            <div className="h-px bg-border max-w-[50%]"></div>
                                            <div>
                                                <div className="text-xs font-bold text-text-secondary mb-1">MACD Trend</div>
                                                <p className="text-xs text-text-secondary leading-normal">
                                                    Tracks trend direction. Positive histogram means Bullish momentum is increasing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Context Group */}
                                    <div className="space-y-6">
                                        {/* Day Range Card */}
                                        <div className="glass-card p-5 transition-all hover:border-primary/50">
                                            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                                <span>📊</span> Day Range
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-mono">
                                                    <span className="text-red-500">L: {selectedStock.low?.toFixed(2)}</span>
                                                    <span className="text-emerald-500">H: {selectedStock.high?.toFixed(2)}</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                                    <div
                                                        className="absolute top-0 bottom-0 bg-primary rounded-full transition-all duration-1000"
                                                        style={{
                                                            left: '0%',
                                                            width: `${Math.min(100, Math.max(0, (((selectedStock.ltp || 0) - (selectedStock.low || 0)) / ((selectedStock.high || 1) - (selectedStock.low || 0))) * 100))}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Your Position Card */}
                                        <div className="glass-card p-5 transition-all hover:border-primary/50">
                                            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                                <span>💼</span> Your Position
                                            </h3>
                                            {portfolio?.holdings?.find(h => h.instrumentKey === selectedStock.instrumentKey) ? (
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const h = portfolio.holdings.find(h => h.instrumentKey === selectedStock.instrumentKey)!;
                                                        const pnl = ((selectedStock.ltp || 0) - h.avgPrice) * h.quantity;
                                                        const pnlPercent = (((selectedStock.ltp || 0) - h.avgPrice) / h.avgPrice) * 100;
                                                        return (
                                                            <>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                                                                    <span className="font-bold text-gray-900 dark:text-white">{h.quantity}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-500 dark:text-gray-400">Avg. Price</span>
                                                                    <span className="font-mono text-gray-900 dark:text-white">₹{h.avgPrice.toFixed(2)}</span>
                                                                </div>
                                                                <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                                                    <span className="text-xs font-bold uppercase text-gray-500">P&L</span>
                                                                    <span className={`font-mono font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                                                                    </span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <div className="text-3xl mb-2 opacity-50">🤷‍♂️</div>
                                                    <p className="text-xs text-text-secondary">You do not own this stock.</p>
                                                    <a href="/portfolio" className="block mt-3 text-xs text-primary font-bold hover:underline">
                                                        Go to Portfolio to Trade
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-50">
                            <div className="text-6xl mb-4">🧠</div>
                            <p className="text-lg font-medium">Select a stock to generate AI Analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
