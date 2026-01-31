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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-text-primary mb-3">AI Market Advisor 🧠</h1>
                    <p className="text-text-secondary">Ask for an analysis and get professional insights instantly.</p>
                </div>

                {/* Search / Selection Area */}
                <div className="relative max-w-xl mx-auto mb-12">
                    <input
                        type="text"
                        placeholder="Search for a stock (e.g., RELIANCE, INFY)..."
                        className="w-full px-6 py-4 text-lg bg-surface border border-border rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary pl-14"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!e.target.value) setSelectedStockKey(null);
                        }}
                    />
                    <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 text-text-secondary h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>

                    {/* Dropdown Results */}
                    {searchTerm && !selectedStock && filteredStocks.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-xl shadow-xl border border-border overflow-hidden z-10">
                            {filteredStocks.map(stock => (
                                <div
                                    key={stock.instrumentKey}
                                    onClick={() => {
                                        setSelectedStockKey(stock.instrumentKey);
                                        setSearchTerm(stock.symbol);
                                    }}
                                    className="px-6 py-3 hover:bg-surface-hover cursor-pointer flex justify-between items-center group"
                                >
                                    <span className="font-semibold text-text-primary">{stock.symbol}</span>
                                    <span className="text-text-secondary text-sm group-hover:text-primary">Analyze →</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Analysis Result Area */}
                {selectedStock && (
                    <div className="animate-fade-in space-y-8">
                        {/* Stock Header */}
                        <div className="flex items-center justify-between p-6 bg-surface rounded-xl border-l-4 border-primary shadow-sm">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">{selectedStock.symbol}</h2>
                                <p className="text-text-secondary text-sm">Real-time Analysis based on technical indicators</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-text-primary">₹{(selectedStock.ltp || 0).toFixed(2)}</p>
                                <p className={`text-sm font-medium ${(selectedStock.change || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                    {(selectedStock.change || 0).toFixed(2)}%
                                </p>
                                <p className="text-xs text-text-secondary mt-1 opacity-70">
                                    {selectedStock.lastUpdated ? new Date(selectedStock.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                            </div>
                        </div>

                        {/* Two Columns: Analysis & Education */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* The Analysis Component */}
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                                    <span className="bg-primary/10 text-primary p-1.5 rounded-lg mr-2">🤖</span>
                                    Advisor Verdict
                                </h3>
                                {/* We reuse the component but styling might need a tweak as it was built for a modal */}
                                <div className="bg-surface rounded-xl p-2 shadow-sm border border-border">
                                    <TradeAnalysis
                                        stock={selectedStock}
                                        currentPrice={selectedStock.ltp || 0}
                                    />
                                </div>
                            </div>

                            {/* Educational Context */}
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                                    <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg mr-2">📚</span>
                                    Why this signal?
                                </h3>
                                <div className="bg-surface rounded-xl p-6 shadow-sm border border-border space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-text-primary border-b border-border pb-1">Understanding RSI</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            The <span className="text-primary font-medium">Relative Strength Index (RSI)</span> measures momentum.
                                            <br />• Above 70? The stock might be expensive (Overbought).
                                            <br />• Below 30? It might be cheap (Oversold).
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-text-primary border-b border-border pb-1">MACD Crossover</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            <span className="text-primary font-medium">MACD</span> shows trend direction.
                                            <br />• Histogram &gt; 0: Bullish momentum building.
                                            <br />• Histogram &lt; 0: Bearish momentum building.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-text-primary border-b border-border pb-1">Trend (EMA)</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            We check the <span className="text-primary font-medium">50-day EMA</span>.
                                            <br />• Price &gt; EMA? The short-term trend is Up.
                                            <br />• Price &lt; EMA? The short-term trend is Down.
                                        </p>
                                    </div>

                                    <div className="mt-4 p-3 bg-background rounded-lg text-center">
                                        <p className="text-xs text-text-secondary italic">
                                            "A good trader waits for the signal, but executes with their own judgment."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
