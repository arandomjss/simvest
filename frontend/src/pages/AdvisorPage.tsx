import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Brain, 
    Building2, 
    Globe, 
    Layers, 
    Cpu, 
    TrendingUp,
    Target,
    RefreshCw
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { TradeAnalysis } from '../components/TradeAnalysis';
import { MarketWatch } from '../components/MarketWatch';
import { PortfolioStrip } from '../components/Dashboard/PortfolioStrip';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { apiService } from '../services/api';
import { ErrorBoundary } from '../components/ErrorBoundary';

const IntelligenceLog = ({ symbol, isComplete }: { symbol: string, isComplete: boolean }) => {
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        if (!symbol) return;
        setLogs([]);
        const steps = [
            `[${new Date().toLocaleTimeString()}] Accessing Institutional Data Lake for ${symbol}...`,
            `[${new Date().toLocaleTimeString()}] Initializing EMA Convergence Scan (50/200)...`,
            `[${new Date().toLocaleTimeString()}] Calculating RSI(14) Momentum Variance...`,
            `[${new Date().toLocaleTimeString()}] NLP News Sentiment Aggregation...`,
            `[${new Date().toLocaleTimeString()}] Synthesizing LLM Investment Thesis...`
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < steps.length) {
                setLogs(prev => [...prev, steps[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [symbol]);

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 font-mono text-[10px] text-slate-600 dark:text-emerald-500/80 space-y-2 h-44 overflow-hidden relative border border-slate-200 dark:border-white/5 shadow-inner">
            <div className="absolute top-3 right-5 flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${!isComplete ? 'animate-ping' : ''}`} />
                <span className="text-[8px] uppercase font-black text-slate-400 dark:text-emerald-500/40 tracking-widest">Live Engine</span>
            </div>
            {logs.map((log, i) => (
                <motion.div 
                    initial={{ opacity: 0, x: -2 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i}
                    className="flex gap-2"
                >
                    <span className="text-emerald-600/50 dark:text-emerald-500/30">›</span> {log}
                </motion.div>
            ))}
            {!isComplete && logs.length === 5 && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase italic">Correlating Data Points...</span>
                </div>
            )}
        </div>
    );
};

export const AdvisorPage = () => {
    const { stocks, fetchInstruments, connectWebSocket, disconnectWebSocket } = useMarketStore();
    const { portfolio, fetchPortfolio } = usePortfolioStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    const performAnalysis = async (symbol: string) => {
        setIsAnalyzing(true);
        try {
            const data = await apiService.getDeepAnalysis(symbol);
            setTimeout(() => {
                setAnalysis(data);
                setIsAnalyzing(false);
            }, 2500);
        } catch (e) {
            console.error("Analysis failed", e);
            setIsAnalyzing(false);
        }
    };

    // Handle selection from MarketWatch
    useEffect(() => {
        if (selectedStockKey) {
            const sym = stocks.find(s => s.instrumentKey === selectedStockKey)?.symbol;
            if (sym) {
                setAnalysis(null); // Reset when switching
                performAnalysis(sym);
            }
        }
    }, [selectedStockKey]);

    const handleManualRefresh = () => {
        if (selectedStock && !isAnalyzing) {
            performAnalysis(selectedStock.symbol);
        }
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Top Navigation - Shared Dashboard Style */}
            <div className="flex-none">
                <Navbar
                    showSearch={true}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
            </div>

            {/* Status Bar (Portfolio Metrics) - Shared Dashboard Style */}
            <div className="flex-none">
                <PortfolioStrip portfolio={portfolio} />
            </div>

            <div className="flex-1 flex overflow-hidden relative z-0">
                {/* LEFT PANEL: MARKET WATCH (Unified Sidebar) */}
                <div className="w-80 md:w-96 border-r border-gray-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 flex flex-col">
                    <ErrorBoundary>
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <MarketWatch
                                stocks={stocks}
                                searchTerm={searchTerm}
                                isLoading={stocks.length === 0}
                                compact={true}
                                onSelect={(stock) => setSelectedStockKey(stock.instrumentKey)}
                                disablePopup={true}
                            />
                        </div>
                    </ErrorBoundary>
                </div>

                {/* RIGHT PANEL: MAIN ADVISOR WORKSPACE */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6 md:p-8">
                    {selectedStock ? (
                        <div className="max-w-5xl mx-auto space-y-6">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-2">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Institutional Terminal</span>
                                        </div>
                                        <button 
                                            onClick={handleManualRefresh}
                                            disabled={isAnalyzing}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isAnalyzing ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20'}`}
                                        >
                                            <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                                            {isAnalyzing ? 'Analyzing...' : 'Refresh Thesis'}
                                        </button>
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{selectedStock.symbol}</h1>
                                    <p className="text-slate-500 dark:text-gray-400 font-bold text-sm tracking-tight mt-1">{selectedStock.name}</p>
                                </div>
                                <div className="text-left md:text-right bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution Price</div>
                                    <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">₹{(selectedStock.ltp || 0).toFixed(2)}</div>
                                    <div className={`text-xs font-black ${(selectedStock.change || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {(selectedStock.change || 0) >= 0 ? '▲' : '▼'} {(selectedStock.changePercent || 0).toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            {/* CORE ANALYSIS GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* MAIN ANALYSIS: 8 cols */}
                                <div className="lg:col-span-8 space-y-6">
                                    {/* AI Verdict Tile */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                                        <TradeAnalysis 
                                            analysis={analysis} 
                                            isLoading={isAnalyzing} 
                                        />
                                    </div>

                                    {/* Intelligence Stream Log */}
                                    {isAnalyzing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <IntelligenceLog symbol={selectedStock.symbol} isComplete={!!analysis} />
                                        </motion.div>
                                    )}

                                    {/* Company DNA Tile */}
                                    {analysis?.profile && !isAnalyzing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400"><Building2 size={24} /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Sector</span>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{analysis.profile.sector}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400"><Layers size={24} /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Structure</span>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{analysis.profile.industry}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400"><Globe size={24} /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Origin</span>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">India Dominant</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* SIDEBAR TOOLS: 4 cols */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Portfolio Context */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <TrendingUp size={12} /> Execution Context
                                        </h3>
                                        {portfolio?.holdings?.find(h => h.instrumentKey === selectedStock.instrumentKey) ? (
                                            <div className="space-y-4">
                                                {(() => {
                                                    const h = portfolio.holdings.find(h => h.instrumentKey === selectedStock.instrumentKey)!;
                                                    const pnl = ((selectedStock.ltp || 0) - h.avgPrice) * h.quantity;
                                                    const pnlPercent = (((selectedStock.ltp || 0) - h.avgPrice) / h.avgPrice) * 100;
                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center px-5 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity</span>
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">{h.quantity}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center px-5 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Pay</span>
                                                                <span className="text-sm font-mono font-black text-slate-900 dark:text-white">₹{h.avgPrice.toFixed(2)}</span>
                                                            </div>
                                                            <div className={`mt-6 p-6 rounded-3xl border-2 ${pnl >= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total P&L</span>
                                                                <div className={`text-2xl font-mono font-black ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                                    {pnlPercent.toFixed(2)}% ROI Detect
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                                <Target size={32} className="mx-auto mb-4 opacity-10" />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-8">No active position detected for this ticker.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Algorithm Information */}
                                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Cpu size={120} />
                                        </div>
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6">Terminal Pulse</h3>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="text-[10px] font-black text-white uppercase mb-1">Signal Sync: <span className="text-emerald-500">Live</span></div>
                                                    <p className="text-[9px] text-slate-400 font-medium uppercase leading-relaxed">Aggregating L2 Data Streams every 5 seconds for execution precision.</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-white/5" />
                                            <div>
                                                <div className="text-[10px] font-black text-white uppercase mb-1">Advisor Cycle: <span className="text-blue-400">On-Demand</span></div>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase leading-relaxed">AI thesis generation is optimized for request-based synthesis (Manual Refresh enabled).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto shadow-2xl">
                                    <Brain size={48} className="text-emerald-600" />
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Intelligence Hub</h2>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">Select a ticker from the Market Watch to begin deep institutional analysis.</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
