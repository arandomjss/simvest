import { useState, useEffect } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Holding } from '../types';
import { X, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

const STRATEGIES = ['', 'Breakout', 'Mean Reversion', 'Momentum', 'Value', 'Swing Trade', 'Scalping', 'News Play'];

interface ClosePositionModalProps {
    holding: Holding & { change?: number; changePercent?: number };
    onClose: () => void;
    onSuccess: () => void;
}

export const ClosePositionModal = ({ holding, onClose, onSuccess }: ClosePositionModalProps) => {
    const { executeTrade, fetchPortfolio, fetchLivePrices } = usePortfolioStore();

    const livePrice = holding.currentPrice || holding.avgPrice;
    const maxQty = holding.quantity;

    const [qty, setQty] = useState(maxQty);
    const [notes, setNotes] = useState('');
    const [strategy, setStrategy] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const pnlPerShare = livePrice - holding.avgPrice;
    const totalPnL = pnlPerShare * qty;
    const totalValue = livePrice * qty;
    const isPL = totalPnL >= 0;

    // Preset quick-close options
    const presets = [
        { label: '25%', value: Math.max(1, Math.floor(maxQty * 0.25)) },
        { label: '50%', value: Math.max(1, Math.floor(maxQty * 0.5)) },
        { label: '75%', value: Math.max(1, Math.floor(maxQty * 0.75)) },
        { label: '100%', value: maxQty },
    ];

    useEffect(() => {
        // Trap scroll behind modal
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleConfirm = async () => {
        setError('');
        setIsLoading(true);
        try {
            await executeTrade(
                holding.symbol,
                holding.instrumentKey,
                'SELL',
                qty,
                'MARKET',
                undefined,
                strategy || undefined,
                notes || undefined
            );
            await fetchPortfolio();
            await fetchLivePrices();
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1800);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Trade failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Panel */}
            <div
                className="relative w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Success State */}
                {success && (
                    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Position Closed!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sold {qty} shares of <strong>{holding.symbol}</strong> at ₹{livePrice.toFixed(2)}
                        </p>
                        <p className={`text-xl font-extrabold ${isPL ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPL ? '+' : ''}₹{totalPnL.toFixed(2)} P&L
                        </p>
                    </div>
                )}

                {/* Normal State */}
                {!success && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Close Position</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{holding.symbol} · {maxQty} shares held</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            {/* Live Price Summary */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Avg Cost', value: `₹${holding.avgPrice.toFixed(2)}`, sub: 'per share', color: 'text-gray-700 dark:text-gray-200' },
                                    { label: 'Live Price', value: `₹${livePrice.toFixed(2)}`, sub: holding.changePercent !== undefined ? `${(holding.changePercent || 0) >= 0 ? '▲' : '▼'} ${Math.abs(holding.changePercent || 0).toFixed(2)}% today` : 'market', color: (holding.changePercent || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
                                    { label: 'Unrealised P&L', value: `${(holding.pnl || 0) >= 0 ? '+' : ''}₹${(holding.pnl || 0).toFixed(2)}`, sub: `${(holding.pnlPercent || 0).toFixed(2)}%`, color: (holding.pnl || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
                                ].map(({ label, value, sub, color }) => (
                                    <div key={label} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                                        <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                                        <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
                                        <div className={`text-[9px] mt-0.5 ${color} opacity-80`}>{sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Qty Selector */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                    Shares to Sell
                                </label>
                                {/* Quick Presets */}
                                <div className="flex gap-2 mb-2">
                                    {presets.map(p => (
                                        <button
                                            key={p.label}
                                            onClick={() => setQty(p.value)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${qty === p.value
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-red-300'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Fine-tune input */}
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxQty}
                                        value={qty}
                                        onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-full h-10 px-3 text-sm font-mono bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                        of {maxQty}
                                    </span>
                                </div>
                            </div>

                            {/* Exit Journal (collapsible feel) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                    Exit Reasoning <span className="normal-case font-normal text-gray-400">(optional)</span>
                                </label>
                                <div className="relative mb-2">
                                    <select
                                        value={strategy}
                                        onChange={e => setStrategy(e.target.value)}
                                        className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary appearance-none pr-8 transition-all text-gray-700 dark:text-gray-200"
                                    >
                                        <option value="">Tag exit strategy (optional)</option>
                                        {STRATEGIES.filter(Boolean).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Why are you closing this position? (adds to your journal)"
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-gray-400 text-gray-700 dark:text-gray-200"
                                />
                            </div>

                            {/* P&L Preview */}
                            <div className={`rounded-xl p-3 flex items-center justify-between ${isPL ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40'}`}>
                                <div className="flex items-center gap-2">
                                    {isPL
                                        ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        : <TrendingDown className="w-4 h-4 text-red-500" />
                                    }
                                    <div>
                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-300">You will receive</div>
                                        <div className="text-[10px] text-gray-400">Proceeds from sale</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold font-mono text-gray-900 dark:text-white">₹{totalValue.toFixed(2)}</div>
                                    <div className={`text-xs font-semibold ${isPL ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                        {isPL ? '+' : ''}₹{totalPnL.toFixed(2)} P&L on this trade
                                    </div>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    <AlertTriangle className="w-4 h-4 flex-none" />
                                    {error}
                                </div>
                            )}

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading || qty < 1}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Executing Sell…
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="w-4 h-4" />
                                        Sell {qty} share{qty > 1 ? 's' : ''} of {holding.symbol}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
