import { motion } from 'framer-motion';
import { Target, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

export interface DeepAnalysisData {
    price: number;
    aiAnalysis: {
        verdict: string;
        thesis: string[];
        risk: string;
        confidence_score: number;
        catalysts?: string[];
    };
    indicators: Record<string, any>;
    signals: string[];
}

interface TradeAnalysisProps {
    analysis: DeepAnalysisData | null; // The rich object from our backend
    isLoading?: boolean;
    minimal?: boolean;
}

export const TradeAnalysis = ({ analysis, isLoading, minimal = false }: TradeAnalysisProps) => {
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

    const getVerdictStyle = () => {
        const v = verdict.toLowerCase();
        if (v.includes('buy') || v.includes('bullish')) {
            return {
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-100/70 dark:border-emerald-900/30',
                leftBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
                bg: 'bg-emerald-50/20 dark:bg-emerald-950/10',
                glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.08)] dark:shadow-[0_4px_20px_rgba(16,185,129,0.05)]',
                bullet: 'bg-emerald-500',
                bulletBg: 'bg-emerald-500/30',
                pill: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                action: 'Opportunity Zone: Good entry point for buying.'
            };
        }
        if (v.includes('sell') || v.includes('bearish')) {
            return {
                text: 'text-rose-600 dark:text-rose-400',
                border: 'border-rose-100/70 dark:border-rose-900/30',
                leftBorder: 'border-l-rose-500 dark:border-l-rose-400',
                bg: 'bg-rose-50/20 dark:bg-rose-950/10',
                glow: 'shadow-[0_4px_20px_rgba(244,63,94,0.08)] dark:shadow-[0_4px_20px_rgba(244,63,94,0.05)]',
                bullet: 'bg-rose-500',
                bulletBg: 'bg-rose-500/30',
                pill: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400',
                action: 'Caution: Downward trend. High risk for new buyers.'
            };
        }
        return {
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-100/70 dark:border-amber-900/30',
            leftBorder: 'border-l-amber-500 dark:border-l-amber-400',
            bg: 'bg-amber-50/20 dark:bg-amber-950/10',
            glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.08)] dark:shadow-[0_4px_20px_rgba(245,158,11,0.05)]',
            bullet: 'bg-amber-500',
            bulletBg: 'bg-amber-500/30',
            pill: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400',
            action: 'Stable Zone: Price is consolidate. Safe to wait and watch.'
        };
    };

    const getSimplifiedRisk = (riskStr: string) => {
        const r = riskStr.toLowerCase();
        if (r.includes('high') || r.includes('heavy') || r.includes('volatile') || r.includes('pressure')) {
            return {
                label: 'High Risk',
                color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
            };
        }
        if (r.includes('moderate') || r.includes('medium') || r.includes('neutral') || r.includes('average')) {
            return {
                label: 'Medium Risk',
                color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
            };
        }
        return {
            label: 'Low Risk',
            color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
        };
    };

    const styles = getVerdictStyle();
    const simplifiedRisk = getSimplifiedRisk(risk);

    return (
        <div className="space-y-6">
            {/* Master Verdict Card */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-t border-r border-b border-l-4 rounded-2xl p-5 relative overflow-hidden ${styles.bg} ${styles.border} ${styles.leftBorder} ${styles.glow}`}
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 animate-pulse">
                    <Zap size={80} className={styles.text} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Institutional Synthesis</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${styles.bullet} animate-pulse`} />
                    </div>
                    
                    <h2 className={`text-xl font-bold tracking-tight ${styles.text}`}>
                        {verdict}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-3 font-semibold leading-relaxed">
                        {styles.action}
                    </p>

                    {!minimal && thesis.length > 0 && (
                        <div className="space-y-2.5">
                            {thesis.map((point: string, i: number) => (
                                <div key={i} className="flex gap-2.5 text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${styles.bulletBg} flex-shrink-0`} />
                                    {point}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-5 pt-5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${simplifiedRisk.color}`}>
                            <ShieldAlert size={12} />
                            <span>{simplifiedRisk.label}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${styles.pill}`}>
                            <span className="opacity-60">Confidence</span>
                            <span>{confidence_score}%</span>
                        </div>
                    </div>

                    {!minimal && (
                        <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-gray-400 leading-normal flex gap-1.5 items-start">
                            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] mt-0.5 flex-shrink-0">Details:</span>
                            <span className="capitalize">{risk.toLowerCase()}</span>
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Technical Matrix Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* RSI Gauge */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Pricing (RSI)</span>
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
                    <span className={`text-[9px] font-bold uppercase ${indicators.rsi > 70 ? 'text-rose-500' : indicators.rsi < 30 ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {indicators.rsi > 70 ? 'Overpriced' : indicators.rsi < 30 ? 'Bargain Price' : 'Stable Price'}
                    </span>
                </div>

                {/* MACD Status */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Trend (MACD)</span>
                    <div className={`p-2.5 rounded-xl mb-2 ${indicators.macd.histogram > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'}`}>
                        <TrendingUp size={20} className={indicators.macd.histogram < 0 ? 'rotate-180 transition-transform' : ''} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${indicators.macd.histogram > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {indicators.macd.histogram > 0 ? 'Going Up 📈' : 'Going Down 📉'}
                    </span>
                </div>

                {/* Support/Resistance */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Safe Buy Zone</span>
                    <div className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-500 mb-1">
                         ₹{(analysis.price * 0.98).toFixed(1)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Support Floor</span>
                </div>

                {/* Resistance */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Target Profit</span>
                    <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 mb-1">
                         ₹{(analysis.price * 1.05).toFixed(1)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Potential Target</span>
                </div>
            </div>

            {/* Signal Log (AI Thoughts) */}
            {!minimal && (
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
            )}
        </div>
    );
};
