import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, PieChart, AlertTriangle, Layers } from 'lucide-react';
import { getSector } from '../utils/sectorUtils';

interface PortfolioRiskAnalysisProps {
    holdings: any[];
    totalValue: number;
}

export const PortfolioRiskAnalysis = ({ holdings, totalValue }: PortfolioRiskAnalysisProps) => {

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
            const s = getSector(h.symbol);
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
            risksList.push({ type: 'warning', msg: `Single stock dominates >40% of portfolio.` });
            calculatedScore -= 15;
        }

        // Clamp Score
        calculatedScore = Math.max(0, calculatedScore);

        return {
            score: calculatedScore,
            risks: risksList,
            metrics: { topSector: maxSectorName, topSectorPct, uniqueSectors }
        };
    }, [holdings, totalValue]);


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
        <div className="card h-full border border-border bg-surface flex flex-col">
            <div className="p-4 border-b border-border bg-surface-hover/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">Risk Analysis</h3>
                </div>
                {/* Score Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-border" />
                        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={`${ringColor} transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className={`absolute text-xs font-bold ${scoreColor}`}>{score}</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-background rounded p-2 border border-border">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <Layers className="w-3 h-3" /> Sectors
                        </div>
                        <div className="font-bold text-text-primary">{metrics.uniqueSectors}</div>
                    </div>
                    <div className="bg-background rounded p-2 border border-border">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <PieChart className="w-3 h-3" /> Density
                        </div>
                        <div className="font-bold text-text-primary">{metrics.topSectorPct.toFixed(0)}% <span className="text-[10px] font-normal text-text-secondary">in Top</span></div>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-2">
                    {risks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-20 text-center">
                            <ShieldCheck className="w-8 h-8 text-profit mb-2 opacity-50" />
                            <p className="text-xs text-text-secondary">Your portfolio looks balanced!</p>
                        </div>
                    ) : (
                        risks.map((risk, idx) => (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded text-xs border ${risk.type === 'danger' ? 'bg-loss/5 border-loss/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${risk.type === 'danger' ? 'text-loss' : 'text-yellow-500'}`} />
                                <span className="text-text-primary leading-tight">{risk.msg}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="p-2 border-t border-border text-[10px] text-center text-text-muted">
                Based on active holdings
            </div>
        </div>
    );
};
