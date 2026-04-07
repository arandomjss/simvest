import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Navbar } from '../components/Navbar';
import { Order } from '../types';
import {
    BookOpen,
    Search,
    TrendingUp,
    TrendingDown,
    Filter,
    MessageSquare,
    Tag,
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

const STRATEGY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Breakout':       { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-800' },
    'Mean Reversion': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    'Momentum':       { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' },
    'Value':          { bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300',border: 'border-emerald-200 dark:border-emerald-800'},
    'Swing Trade':    { bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-300',     border: 'border-rose-200 dark:border-rose-800' },
    'Scalping':       { bg: 'bg-cyan-100 dark:bg-cyan-900/30',     text: 'text-cyan-700 dark:text-cyan-300',     border: 'border-cyan-200 dark:border-cyan-800' },
    'News Play':      { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
};

const DEFAULT_STRATEGY_STYLE = { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-200 dark:border-slate-600' };

const getStrategyStyle = (strategy: string) => STRATEGY_COLORS[strategy] || DEFAULT_STRATEGY_STYLE;

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        relative: (() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        })(),
    };
};

interface JournalEntryProps {
    order: Order;
}

const JournalEntry = ({ order }: JournalEntryProps) => {
    const [expanded, setExpanded] = useState(false);
    const stratStyle = getStrategyStyle(order.strategy || '');
    const dateInfo = formatDate(order.created_at || new Date().toISOString());
    const isBuy = order.type === 'BUY';
    const value = (order.execution_price * order.quantity).toFixed(2);

    const hasNotes = order.notes && order.notes.trim().length > 0;
    const hasStrategy = order.strategy && order.strategy.trim().length > 0;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border ${expanded ? 'border-primary/40 shadow-md shadow-primary/5' : 'border-gray-200 dark:border-slate-700'} overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-slate-600`}>
            {/* Entry Header */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Trade Type Indicator */}
                <div className={`flex-none w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${isBuy ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    {isBuy
                        ? <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        : <ArrowDownRight className="w-5 h-5 text-red-500 dark:text-red-400" />
                    }
                </div>

                {/* Symbol & Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{order.symbol}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBuy ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {order.type}
                        </span>
                        {hasStrategy && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${stratStyle.bg} ${stratStyle.text} ${stratStyle.border}`}>
                                <Tag className="w-2.5 h-2.5" />
                                {order.strategy}
                            </span>
                        )}
                        {hasNotes && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5" />
                                has notes
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {order.quantity} shares · ₹{Number(order.execution_price).toFixed(2)} each · <span className="font-medium text-gray-700 dark:text-gray-300">₹{value}</span>
                    </div>
                </div>

                {/* Date & Expand */}
                <div className="flex-none flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{dateInfo.relative}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">{dateInfo.date}</span>
                    {expanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 mt-1" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-1" />
                    }
                </div>
            </div>

            {/* Expanded Content: Notes + full details */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 p-4 space-y-4 animate-in fade-in slide-in-from-top-1">
                    {/* Trade Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Trade Type', value: order.type },
                            { label: 'Order Type', value: order.order_type || 'MARKET' },
                            { label: 'Quantity', value: order.quantity },
                            { label: 'Exec Price', value: `₹${Number(order.execution_price).toFixed(2)}` },
                            { label: 'Total Amount', value: `₹${Number(order.total_amount || value).toFixed(2)}` },
                            { label: 'Status', value: order.status },
                            { label: 'Date', value: dateInfo.date },
                            { label: 'Time', value: dateInfo.time },
                        ].map(({ label, value: val }) => (
                            <div key={label} className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-gray-100 dark:border-slate-700">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 block mb-1">{label}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{String(val)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pre-Trade Intent Section */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            Pre-Trade Reasoning
                        </h4>
                        <div className="space-y-2">
                            {hasStrategy ? (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${stratStyle.bg} ${stratStyle.text} ${stratStyle.border}`}>
                                    <Tag className="w-3.5 h-3.5" />
                                    Strategy: {order.strategy}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 italic">
                                    No strategy tagged
                                </div>
                            )}

                            {hasNotes ? (
                                <div className="bg-white dark:bg-slate-700/50 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/60 rounded-l-xl" />
                                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pl-2 italic">
                                        "{order.notes}"
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-gray-100 dark:bg-slate-700/30 border border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">No trade notes were recorded for this entry.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const JournalPage = () => {
    const navigate = useNavigate();
    const { orders, fetchOrders } = usePortfolioStore();

    const [search, setSearch] = useState('');
    const [filterStrategy, setFilterStrategy] = useState('All');
    const [filterType, setFilterType] = useState<'All' | 'BUY' | 'SELL'>('All');

    useEffect(() => {
        fetchOrders(200);
    }, []);

    const strategies = useMemo(() => {
        const set = new Set<string>(['All']);
        orders.forEach(o => { if (o.strategy) set.add(o.strategy); });
        return Array.from(set);
    }, [orders]);

    const filtered = useMemo(() => {
        return orders
            .filter(o => o.status === 'EXECUTED')
            .filter(o => filterType === 'All' || o.type === filterType)
            .filter(o => filterStrategy === 'All' || o.strategy === filterStrategy)
            .filter(o => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    o.symbol?.toLowerCase().includes(q) ||
                    o.strategy?.toLowerCase().includes(q) ||
                    o.notes?.toLowerCase().includes(q)
                );
            });
    }, [orders, filterType, filterStrategy, search]);

    const stats = useMemo(() => {
        const executed = orders.filter(o => o.status === 'EXECUTED');
        const withStrategy = executed.filter(o => o.strategy && o.strategy !== 'Uncategorized');
        const withNotes = executed.filter(o => o.notes && o.notes.trim().length > 0);
        return {
            total: executed.length,
            withStrategy: withStrategy.length,
            withNotes: withNotes.length,
            coverage: executed.length > 0 ? Math.round((withStrategy.length / executed.length) * 100) : 0,
        };
    }, [orders]);

    // Group filtered by date
    const grouped = useMemo(() => {
        const groups: Record<string, Order[]> = {};
        filtered.forEach(order => {
            const date = new Date(order.created_at || '').toLocaleDateString('en-IN', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(order);
        });
        return Object.entries(groups);
    }, [filtered]);

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Navbar */}
            <div className="flex-none z-30 relative bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <Navbar />
            </div>

            {/* Page */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                Trade Journal
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your thinking behind every trade — reviewed.</p>
                        </div>
                        <button
                            onClick={() => navigate('/practice')}
                            className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-all shadow-sm shadow-primary/20"
                        >
                            + New Trade
                        </button>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Trades', value: stats.total, icon: '📊' },
                            { label: 'With Strategy', value: stats.withStrategy, icon: '🎯' },
                            { label: 'With Notes', value: stats.withNotes, icon: '✍️' },
                            {
                                label: 'Journal Coverage',
                                value: `${stats.coverage}%`,
                                icon: stats.coverage >= 75 ? '🟢' : stats.coverage >= 40 ? '🟡' : '🔴',
                            },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                                <span className="text-lg">{icon}</span>
                                <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search symbol, strategy, notes…"
                                    className="w-full h-9 pl-9 pr-3 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>

                            {/* Strategy Filter */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Filter className="w-4 h-4 text-gray-400 flex-none" />
                                {strategies.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStrategy(s)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterStrategy === s
                                            ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Buy/Sell Filter */}
                            <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden text-xs font-semibold flex-none">
                                {(['All', 'BUY', 'SELL'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={`px-3 py-1.5 transition-colors ${filterType === t
                                            ? t === 'BUY' ? 'bg-emerald-500 text-white' : t === 'SELL' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Journal Entries */}
                    {grouped.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
                            <div className="inline-flex w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl items-center justify-center text-3xl mb-4">📔</div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your journal is empty</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                                Start placing trades from the Terminal. Tag each trade with a strategy and notes to build your journal.
                            </p>
                            <button
                                onClick={() => navigate('/practice')}
                                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-all"
                            >
                                Go to Terminal
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {grouped.map(([date, dateOrders]) => (
                                <div key={date}>
                                    {/* Date Divider */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{date}</span>
                                        <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                                            {dateOrders.length} {dateOrders.length === 1 ? 'trade' : 'trades'}
                                        </span>
                                    </div>

                                    {/* Entries for this date */}
                                    <div className="space-y-2">
                                        {dateOrders.map(order => (
                                            <JournalEntry key={order.id} order={order} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Coverage nudge */}
                    {stats.total > 0 && stats.coverage < 100 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-center gap-3">
                            <span className="text-xl flex-none">💡</span>
                            <div>
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Improve your journal coverage</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    Only <strong>{stats.coverage}%</strong> of your trades have strategy tags. Tag every trade to unlock better analytics.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/practice')}
                                className="ml-auto flex-none px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Trade Now
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
