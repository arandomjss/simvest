import { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, Calendar, Calculator, Edit2, Check } from 'lucide-react';

interface PortfolioGoalsProps {
    currentValue: number;
}

export const PortfolioGoals = ({ currentValue }: PortfolioGoalsProps) => {
    // State
    const [targetAmount, setTargetAmount] = useState<number>(1000000); // Default 10L
    const [monthlySip, setMonthlySip] = useState<number>(5000);
    const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12% annual

    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [tempTarget, setTempTarget] = useState('');

    // Load from local storage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('wealth_projector_config');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setTargetAmount(parsed.targetAmount || 1000000);
            setMonthlySip(parsed.monthlySip || 5000);
            setExpectedReturn(parsed.expectedReturn || 12);
        }
    }, []);

    // Save on change
    useEffect(() => {
        localStorage.setItem('wealth_projector_config', JSON.stringify({
            targetAmount,
            monthlySip,
            expectedReturn
        }));
    }, [targetAmount, monthlySip, expectedReturn]);

    // Calculate Projection
    const projection = useMemo(() => {
        if (currentValue >= targetAmount) return { months: 0, years: 0, achieved: true };

        let balance = currentValue;
        const monthlyRate = expectedReturn / 100 / 12;
        let months = 0;

        // Cap calculation at 50 years to prevent infinite loops
        const MAX_MONTHS = 12 * 50;

        while (balance < targetAmount && months < MAX_MONTHS) {
            balance = balance * (1 + monthlyRate) + monthlySip;
            months++;
        }

        return {
            months,
            years: (months / 12).toFixed(1),
            achieved: false
        };
    }, [currentValue, targetAmount, monthlySip, expectedReturn]);

    const handleSaveTarget = () => {
        const val = parseInt(tempTarget.replace(/,/g, ''), 10);
        if (!isNaN(val) && val > 0) {
            setTargetAmount(val);
            setIsEditingTarget(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="card h-full border border-border bg-gradient-to-br from-surface to-surface-hover/50 flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Calculator className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-text-primary">Wealth Projector</h3>
                        <p className="text-[10px] text-text-muted">Plan your path to financial freedom</p>
                    </div>
                </div>
                {/* Current Status Badge */}
                <div className="text-right">
                    <p className="text-[10px] text-text-muted">Current Wealth</p>
                    <p className="text-sm font-mono font-bold text-text-primary">{formatCurrency(currentValue)}</p>
                </div>
            </div>

            {/* Interactive Inputs */}
            <div className="p-5 space-y-6 flex-1 overflow-y-auto">

                {/* 1. Target Input */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target Goal</label>
                        {!isEditingTarget ? (
                            <button onClick={() => { setTempTarget(targetAmount.toString()); setIsEditingTarget(true); }} className="text-primary hover:text-primary-hover transition-colors p-1">
                                <Edit2 className="w-3 h-3" />
                            </button>
                        ) : (
                            <button onClick={handleSaveTarget} className="text-profit hover:text-profit-hover transition-colors p-1">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {isEditingTarget ? (
                        <input
                            autoFocus
                            type="text"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(e.target.value)}
                            className="text-2xl font-bold bg-background border border-border rounded px-2 w-full focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Amount"
                        />
                    ) : (
                        <div className="text-2xl font-bold text-text-primary flex items-baseline gap-1">
                            {formatCurrency(targetAmount)}
                        </div>
                    )}
                </div>

                {/* 2. Monthly SIP Slider */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-text-secondary font-medium">Monthly Investment (SIP)</label>
                        <span className="text-xs font-bold text-primary">{formatCurrency(monthlySip)}</span>
                    </div>
                    <input
                        type="range"
                        min="500"
                        max="100000"
                        step="500"
                        value={monthlySip}
                        onChange={(e) => setMonthlySip(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-hover"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                        <span>₹500</span>
                        <span>₹1L</span>
                    </div>
                </div>

                {/* 3. Return Rate Slider */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-text-secondary font-medium">Expected Return (Annual)</label>
                        <span className="text-xs font-bold text-purple-500">{expectedReturn}%</span>
                    </div>
                    <input
                        type="range"
                        min="6"
                        max="30"
                        step="0.5"
                        value={expectedReturn}
                        onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-1">
                        <span>FD (6%)</span>
                        <span>High Growth (30%)</span>
                    </div>
                </div>
            </div>

            {/* Result Footer */}
            <div className="mt-auto bg-surface-hover/30 p-4 border-t border-border">
                {projection.achieved ? (
                    <div className="text-center">
                        <div className="text-2xl font-bold text-profit mb-1">Goal Achieved! 🎉</div>
                        <p className="text-xs text-text-secondary">You have crossed your target wealth.</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-text-secondary mb-0.5">Estimated Time</p>
                            <div className="text-2xl font-bold text-text-primary leading-none">
                                {projection.years} <span className="text-sm font-normal text-text-secondary">Years</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-secondary mb-0.5">Completion Date</p>
                            <div className="text-sm font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(new Date().setMonth(new Date().getMonth() + projection.months)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
