import { useMemo } from 'react';
import { ShieldCheck, PieChart, AlertTriangle, Layers } from 'lucide-react';
import { getSector } from '../utils/sectorUtils';

import { Stock } from '../types';

interface PortfolioRiskAnalysisProps {
    holdings: any[];
    totalValue: number;
    stocks: Stock[] | undefined;
}

export const PortfolioRiskAnalysis = ({ holdings, totalValue, stocks = [] }: PortfolioRiskAnalysisProps) => {

    const { score, risks, metrics } = useMemo(() => {
        if (!holdings || holdings.length === 0) {
            return { score: 0, risks: [], metrics: { topSector: 'None', topSectorPct: 0, uniqueSectors: 0 } };
        }

        const risksList = [];
        let calculatedScore = 100;

        // 1. Calculate Sector Allocation
        const sectorMap: Record<string, number> = {};
        let maxSectorVal = 0;
        let maxSectorName = '';

        holdings.forEach(h => {
            const stock = stocks.find(s => s.symbol === h.symbol || s.instrumentKey === h.instrumentKey);
            const s = stock?.sector || getSector(h.symbol);
            const val = h.currentValue || 0;
            sectorMap[s] = (sectorMap[s] || 0) + val;
        });

        Object.entries(sectorMap).forEach(([s, val]) => {
            if (val > maxSectorVal) {
                maxSectorVal = val;
                maxSectorName = s;
            }
        });

        const topSectorPct = totalValue > 0 ? (maxSectorVal / totalValue) * 100 : 0;
        const uniqueSectors = Object.keys(sectorMap).length;

        // 2. Risk Checks

        // A. Diversity Check (Stock Count)
        if (holdings.length < 3) {
            risksList.push({ type: 'danger', msg: "Portfolio is under-diversified (< 3 stocks)." });
            calculatedScore -= 30;
        } else if (holdings.length < 5) {
            risksList.push({ type: 'warning', msg: "Consider adding more positions to spread risk." });
            calculatedScore -= 10;
        }

        // B. Concentration Check (Sector)
        if (topSectorPct > 50) {
            risksList.push({ type: 'danger', msg: `Critical exposure to ${maxSectorName} (${topSectorPct.toFixed(0)}%).` });
            calculatedScore -= 30;
        } else if (topSectorPct > 30) {
            risksList.push({ type: 'warning', msg: `High concentration in ${maxSectorName} (${topSectorPct.toFixed(0)}%).` });
            calculatedScore -= 10;
        }

        // C. Single Stock Overweight
        const maxStockVal = Math.max(...holdings.map(h => h.currentValue || 0));
        const maxStockPct = totalValue > 0 ? (maxStockVal / totalValue) * 100 : 0;

        if (maxStockPct > 40) {
            risksList.push({ type: 'warning', msg: `Single stock dominates > 40% of portfolio.` });
            calculatedScore -= 15;
        }

        // Clamp Score
        calculatedScore = Math.max(0, calculatedScore);

        return {
            score: calculatedScore,
            risks: risksList,
            metrics: { topSector: maxSectorName, topSectorPct, uniqueSectors }
        };
    }, [holdings, totalValue, stocks]);


    // Helper for circular progress
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Color logic
    let scoreColor = 'text-profit';
    let ringColor = 'stroke-profit';
    if (score < 50) { scoreColor = 'text-loss'; ringColor = 'stroke-loss'; }
    else if (score < 80) { scoreColor = 'text-warning'; ringColor = 'stroke-yellow-500'; }

    return (
        <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Risk Analysis</h3>
                </div>
                {/* Score Ring */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-100 dark:text-slate-700" />
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={offset}
                            className={`${ringColor} transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className={`absolute text-[10px] font-bold ${scoreColor}`}>{score}</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
                            <Layers className="w-3.5 h-3.5" /> Sectors
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{metrics.uniqueSectors}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
                            <PieChart className="w-3.5 h-3.5" /> Concentration
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{metrics.topSectorPct.toFixed(0)}%</div>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-2">
                    {risks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 text-center">
                            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                            <p className="text-xs font-medium text-gray-500">Your portfolio is well balanced!</p>
                        </div>
                    ) : (
                        risks.map((risk, idx) => (
                            <div key={idx} className={`flex gap-3 p-3 rounded-lg border ${risk.type === 'danger' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${risk.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                                <span className={`text-xs font-medium leading-snug ${risk.type === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>{risk.msg}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30 text-[10px] text-center text-gray-400 font-medium">
                AI Risk Assessment
            </div>
        </div>
    );
};
