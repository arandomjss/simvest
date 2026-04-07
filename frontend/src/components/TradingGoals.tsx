import { useMemo, useState } from 'react';
import { Order, Portfolio } from '../types';
import { Target, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type GoalType =
    | 'portfolio_return'      // Reach X% overall portfolio return
    | 'win_rate'              // Achieve X% win rate
    | 'journal_coverage'      // Tag X% of trades with strategy
    | 'trade_count'           // Execute X trades total
    | 'profitable_streak';    // Make X profitable sells in a row

interface Goal {
    id: string;
    type: GoalType;
    label: string;
    target: number;
    createdAt: string;
}

// ─── Preset goal templates ────────────────────────────────────────────────────

const GOAL_TEMPLATES: { type: GoalType; icon: string; label: string; description: string; defaultTarget: number; unit: string }[] = [
    {
        type: 'portfolio_return',
        icon: '📈',
        label: 'Portfolio Return',
        description: 'Grow your portfolio value by a target percentage',
        defaultTarget: 10,
        unit: '%',
    },
    {
        type: 'win_rate',
        icon: '🏆',
        label: 'Win Rate',
        description: 'Maintain a win rate across all your closed trades',
        defaultTarget: 60,
        unit: '%',
    },
    {
        type: 'journal_coverage',
        icon: '📔',
        label: 'Journal Coverage',
        description: 'Tag your trades with strategies to build your journal',
        defaultTarget: 80,
        unit: '%',
    },
    {
        type: 'trade_count',
        icon: '⚡',
        label: 'Trade Count',
        description: 'Practice discipline by executing a target number of trades',
        defaultTarget: 20,
        unit: 'trades',
    },
    {
        type: 'profitable_streak',
        icon: '🔥',
        label: 'Profitable Streak',
        description: 'Make a consecutive run of profitable sell trades',
        defaultTarget: 5,
        unit: 'wins',
    },
];

const STORAGE_KEY = 'simvest_trading_goals';

function loadGoals(): Goal[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

function saveGoals(goals: Goal[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

// ─── Progress Calculator ──────────────────────────────────────────────────────

function useGoalProgress(goal: Goal, orders: Order[], portfolio: Portfolio | null) {
    return useMemo(() => {
        const executed = orders.filter(o => o.status === 'EXECUTED');
        let current = 0;

        if (goal.type === 'portfolio_return') {
            if (portfolio && portfolio.totalInvestment > 0) {
                current = ((portfolio.totalValue - portfolio.totalInvestment) / portfolio.totalInvestment) * 100;
            }
        }

        if (goal.type === 'win_rate') {
            // Compare BUY avg price to SELL execution for matching symbols (FIFO)
            const positions: Record<string, { qty: number; avgPrice: number }> = {};
            let wins = 0, losses = 0;
            [...executed].reverse().forEach(o => {
                if (o.type === 'BUY') {
                    const pos = positions[o.instrument_key] || { qty: 0, avgPrice: 0 };
                    const newQty = pos.qty + o.quantity;
                    const newAvg = ((pos.qty * pos.avgPrice) + (o.execution_price * o.quantity)) / newQty;
                    positions[o.instrument_key] = { qty: newQty, avgPrice: newAvg };
                } else if (o.type === 'SELL') {
                    const pos = positions[o.instrument_key];
                    if (pos) {
                        const pnl = (o.execution_price - pos.avgPrice) * o.quantity;
                        if (pnl > 0) wins++;
                        else losses++;
                        pos.qty -= o.quantity;
                    }
                }
            });
            const total = wins + losses;
            current = total > 0 ? (wins / total) * 100 : 0;
        }

        if (goal.type === 'journal_coverage') {
            const withStrategy = executed.filter(o => o.strategy && o.strategy !== 'Uncategorized').length;
            current = executed.length > 0 ? (withStrategy / executed.length) * 100 : 0;
        }

        if (goal.type === 'trade_count') {
            current = executed.length;
        }

        if (goal.type === 'profitable_streak') {
            // Count current consecutive winning SELL trades
            let streak = 0;
            const positions2: Record<string, { qty: number; avgPrice: number }> = {};
            const sellResults: boolean[] = [];
            [...executed].reverse().forEach(o => {
                if (o.type === 'BUY') {
                    const pos = positions2[o.instrument_key] || { qty: 0, avgPrice: 0 };
                    const newQty = pos.qty + o.quantity;
                    const newAvg = ((pos.qty * pos.avgPrice) + (o.execution_price * o.quantity)) / newQty;
                    positions2[o.instrument_key] = { qty: newQty, avgPrice: newAvg };
                } else if (o.type === 'SELL') {
                    const pos = positions2[o.instrument_key];
                    if (pos) {
                        const pnl = (o.execution_price - pos.avgPrice) * o.quantity;
                        sellResults.push(pnl > 0);
                    }
                }
            });
            for (let i = sellResults.length - 1; i >= 0; i--) {
                if (sellResults[i]) streak++;
                else break;
            }
            current = streak;
        }

        const progress = Math.min(100, goal.target > 0 ? (current / goal.target) * 100 : 0);
        const isComplete = current >= goal.target;

        return { current, progress, isComplete };
    }, [goal, orders, portfolio]);
}

// ─── Single Goal Card ─────────────────────────────────────────────────────────

const GoalCard = ({
    goal,
    orders,
    portfolio,
    onDelete,
}: {
    goal: Goal;
    orders: Order[];
    portfolio: Portfolio | null;
    onDelete: (id: string) => void;
}) => {
    const { current, progress, isComplete } = useGoalProgress(goal, orders, portfolio);
    const template = GOAL_TEMPLATES.find(t => t.type === goal.type)!;
    const isPercent = template.unit === '%';
    const displayCurrent = isPercent ? current.toFixed(1) : Math.floor(current);

    let progressColor = 'bg-primary';
    if (isComplete) progressColor = 'bg-emerald-500';
    else if (progress >= 60) progressColor = 'bg-blue-500';
    else if (progress >= 30) progressColor = 'bg-amber-500';
    else progressColor = 'bg-rose-400';

    return (
        <div className={`relative bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-sm transition-all ${isComplete ? 'border-emerald-400/50 dark:border-emerald-500/30 shadow-emerald-100 dark:shadow-emerald-900/10' : 'border-gray-200 dark:border-slate-700'}`}>
            {isComplete && (
                <div className="absolute top-3 right-10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
            )}
            <button
                onClick={() => onDelete(goal.id)}
                className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{goal.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {displayCurrent}{template.unit} {isComplete ? '✓ Complete!' : ''}
                    </span>
                    <span className="text-gray-400">Target: {goal.target}{template.unit}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-right text-[10px] text-gray-400">{progress.toFixed(0)}% there</div>
            </div>
        </div>
    );
};

// ─── Add Goal Modal ───────────────────────────────────────────────────────────

const AddGoalModal = ({ onAdd, onClose, existingGoalTypes }: {
    onAdd: (goal: Goal) => void;
    onClose: () => void;
    existingGoalTypes: GoalType[];
}) => {
    const [selected, setSelected] = useState<GoalType | null>(null);
    const [target, setTarget] = useState<string>('');
    const [label, setLabel] = useState<string>('');

    const template = GOAL_TEMPLATES.find(t => t.type === selected);

    const handleSelect = (type: GoalType) => {
        setSelected(type);
        const t = GOAL_TEMPLATES.find(t => t.type === type)!;
        setTarget(String(t.defaultTarget));
        setLabel(t.label);
    };

    const handleAdd = () => {
        if (!selected || !target) return;
        const goal: Goal = {
            id: `goal-${Date.now()}`,
            type: selected,
            label: label || template!.label,
            target: parseFloat(target),
            createdAt: new Date().toISOString(),
        };
        onAdd(goal);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Set a New Goal
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Goal type picker */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Choose a goal type</label>
                        <div className="grid grid-cols-1 gap-2">
                            {GOAL_TEMPLATES.map(t => {
                                const alreadyAdded = existingGoalTypes.includes(t.type);
                                return (
                                    <button
                                        key={t.type}
                                        onClick={() => !alreadyAdded && handleSelect(t.type)}
                                        disabled={alreadyAdded}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected === t.type
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                            : alreadyAdded
                                                ? 'border-gray-100 dark:border-slate-700 opacity-40 cursor-not-allowed'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                                        }`}
                                    >
                                        <span className="text-xl">{t.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white block">{t.label}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{t.description}</span>
                                        </div>
                                        {alreadyAdded && <span className="text-[10px] text-gray-400 flex-none">Added</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target input */}
                    {selected && template && (
                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Goal Name</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                    Target ({template.unit})
                                </label>
                                <input
                                    type="number"
                                    value={target}
                                    onChange={e => setTarget(e.target.value)}
                                    min="1"
                                    step={template.unit === '%' ? '5' : '1'}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleAdd}
                        disabled={!selected || !target}
                        className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                    >
                        Add Goal
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface TradingGoalsProps {
    orders: Order[];
    portfolio: Portfolio | null;
}

export const TradingGoals = ({ orders, portfolio }: TradingGoalsProps) => {
    const [goals, setGoals] = useState<Goal[]>(loadGoals);
    const [showModal, setShowModal] = useState(false);

    const existingGoalTypes = goals.map(g => g.type);

    const handleAdd = (goal: Goal) => {
        const updated = [...goals, goal];
        setGoals(updated);
        saveGoals(updated);
    };

    const handleDelete = (id: string) => {
        const updated = goals.filter(g => g.id !== id);
        setGoals(updated);
        saveGoals(updated);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Trading Goals
                    {goals.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-[10px] font-semibold rounded-full">
                            {goals.length}
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={existingGoalTypes.length >= GOAL_TEMPLATES.length}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3 h-3" />
                    Set Goal
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {goals.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="inline-flex w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl items-center justify-center text-2xl mb-3 shadow-inner">
                            🎯
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No goals yet</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
                            Set a target to track — like hitting a 10% return or maintaining a 60% win rate. Goals make learning stick.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                        >
                            Set Your First Goal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                orders={orders}
                                portfolio={portfolio}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <AddGoalModal
                    onAdd={handleAdd}
                    onClose={() => setShowModal(false)}
                    existingGoalTypes={existingGoalTypes}
                />
            )}
        </div>
    );
};
