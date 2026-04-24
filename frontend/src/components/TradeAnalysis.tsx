import { motion } from 'framer-motion';
import { Target, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

interface TradeAnalysisProps {
    analysis: any; // The rich object from our backend
    isLoading?: boolean;
}

export const TradeAnalysis = ({ analysis, isLoading }: TradeAnalysisProps) => {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                    <div className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const { aiAnalysis, indicators, signals } = analysis;
    const { verdict, thesis, risk, confidence_score } = aiAnalysis;

    const getVerdictColor = () => {
        const v = verdict.toLowerCase();
        if (v.includes('buy') || v.includes('bullish')) return 'text-emerald-600 border-emerald-500/20 bg-emerald-50';
        if (v.includes('sell') || v.includes('bearish')) return 'text-rose-600 border-rose-500/20 bg-rose-50';
        return 'text-amber-600 border-amber-500/20 bg-amber-50';
    };

    return (
        <div className="space-y-6">
            {/* Master Verdict Card */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-sm"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Zap size={80} className="text-emerald-600" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-400">Institutional Synthesis</span>
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    
                    <h2 className={`text-3xl font-black mb-4 tracking-tight ${getVerdictColor().split(' ')[0]}`}>
                        {verdict}
                    </h2>

                    <div className="space-y-3">
                        {thesis.map((point: string, i: number) => (
                            <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/40 flex-shrink-0" />
                                {point}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldAlert size={14} className="text-rose-500" />
                            Risk Level: <span className="text-slate-900 dark:text-gray-300 ml-1">{risk}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-white/5 rounded-full border border-emerald-100 dark:border-white/10">
                            <span className="text-[10px] text-emerald-700/60 dark:text-gray-500 uppercase font-black">Confidence</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{confidence_score}%</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Technical Matrix Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* RSI Gauge */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Momentum</span>
                    <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200 dark:text-white/5" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                className={indicators.rsi > 70 ? 'text-rose-500' : indicators.rsi < 30 ? 'text-emerald-500' : 'text-blue-500'}
                                strokeDasharray={175.9}
                                strokeDashoffset={175.9 * (1 - indicators.rsi / 100)}
                            />
                        </svg>
                        <span className="absolute text-sm font-black text-slate-900 dark:text-white">{Math.round(indicators.rsi)}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">RSI (14)</span>
                </div>

                {/* MACD Status */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Trend</span>
                    <div className={`p-3 rounded-xl mb-3 ${indicators.macd.histogram > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'}`}>
                        <TrendingUp size={24} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">MACD Hist</span>
                </div>

                {/* Support/Resistance */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Support</span>
                    <div className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-500 mb-1">
                         ₹{(analysis.price * 0.98).toFixed(1)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">S1 Floor</span>
                </div>

                {/* Resistance */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Target</span>
                    <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 mb-1">
                         ₹{(analysis.price * 1.05).toFixed(1)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">AI Target</span>
                </div>
            </div>

            {/* Signal Log (AI Thoughts) */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Target size={14} />
                    </div>
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Live Detection Logs</span>
                </div>
                <div className="space-y-3">
                    {signals.map((signal: string, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[11px] font-mono border-b border-slate-100 dark:border-white/5 pb-2 last:border-0 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                            <span className="text-slate-600 dark:text-gray-300">{signal}</span>
                            <span className="text-emerald-600 font-bold px-2 py-0.5 rounded bg-emerald-500/10">VALIDATED</span>
                        </div>
                    ))}
                    {signals.length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400 italic">Continuous scanning... No signals detected.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
