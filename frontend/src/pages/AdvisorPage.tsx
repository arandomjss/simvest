import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { TradeAnalysis } from '../components/TradeAnalysis';
import { useMarketStore } from '../stores/marketStore';

export const AdvisorPage = () => {
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(null);

    // Derived state to get the latest live data
    const selectedStock = useMemo(() =>
        stocks.find(s => s.instrumentKey === selectedStockKey),
        [stocks, selectedStockKey]
    );

    useEffect(() => {
        fetchInstruments();
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);

    // Filter stocks for the dropdown
    const filteredStocks = useMemo(() => {
        if (!searchTerm) return [];
        return stocks.filter(s =>
            s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [stocks, searchTerm]);

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL: SEARCH & CONTEXT (350px) */}
                <div className="w-[350px] flex-shrink-0 border-r border-border bg-surface flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>🧠</span> AI Analyst
                        </h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Symbol..."
                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none placeholder-text-muted"
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
                                            className="px-3 py-2 hover:bg-background cursor-pointer text-sm text-text-primary flex justify-between"
                                        >
                                            <span className="font-bold">{stock.symbol}</span>
                                            <span className="text-text-secondary text-xs">Analyze</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access / History (Mock for now) */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <p className="text-xs text-text-muted font-bold mb-3 uppercase">Market Leaders</p>
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
                                        <span className={`text-xs ${(s.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>{(s.change || 0).toFixed(2)}%</span>
                                    </div>
                                    <div className="text-[10px] text-text-secondary mt-1 truncate">{s.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: ANALYSIS CONTENT */}
                <div className="flex-1 bg-background flex flex-col min-w-0 overflow-y-auto">
                    {selectedStock ? (
                        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            {/* Header Card */}
                            <div className="flex items-center justify-between pb-6 border-b border-border">
                                <div>
                                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">{selectedStock.symbol}</h1>
                                    <p className="text-text-secondary">{selectedStock.name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-mono text-text-primary">₹{(selectedStock.ltp || 0).toFixed(2)}</div>
                                    <div className={`text-sm font-medium ${(selectedStock.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        {(selectedStock.change || 0) >= 0 ? '+' : ''}{(selectedStock.change || 0).toFixed(2)} ({((selectedStock.changePercent || 0)).toFixed(2)}%)
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Verdict */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-surface border border-border rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                            <span className="text-primary">🤖</span> AI Technical Verdict
                                        </h3>
                                        <TradeAnalysis
                                            stock={selectedStock}
                                            currentPrice={selectedStock.ltp || 0}
                                        />
                                    </div>
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
