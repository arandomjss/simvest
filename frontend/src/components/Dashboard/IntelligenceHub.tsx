import React, { useState, useMemo } from 'react';
import { Brain, AlertTriangle, Newspaper, TrendingUp, ShieldCheck } from 'lucide-react';
import { PortfolioPerformanceChart } from '../PortfolioPerformanceChart';
import { PortfolioRiskAnalysis } from '../PortfolioRiskAnalysis';
import { StrategyAnalytics } from '../StrategyAnalytics';
import { PortfolioNews } from '../PortfolioNews';
import { Stock, Order, Portfolio, Holding } from '../../types';
import { getSector } from '../../utils/sectorUtils';

interface IntelligenceHubProps {
    holdings: Holding[];
    stocks: Stock[];
    orders: Order[];
    portfolio: Portfolio;
    portfolioHistory: Array<{ date: string; value: number }>;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({
    holdings,
    stocks,
    orders,
    portfolio,
    portfolioHistory
}) => {
    const [activeTab, setActiveTab] = useState<'workspace' | 'analysis'>('workspace');

    // Integrated Vitals Calculation
    const vitals = useMemo(() => {
        const uniqueSectors = new Set(holdings.map(h => {
            const stock = stocks.find(s => s.symbol === h.symbol);
            return stock?.sector || getSector(h.symbol);
        })).size;

        const maxConcentration = Math.max(...holdings.map(h =>
            (((h.currentPrice || h.avgPrice) * h.quantity) / (portfolio?.totalValue || 1)) * 100
        ), 0);

        return { uniqueSectors, maxConcentration, beta: 0.92 };
    }, [holdings, stocks, portfolio]);

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Integrated Header: Vitals + Tabs */}
            <div className="bg-gray-50/50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 px-4 py-1.5 flex flex-wrap items-center justify-between gap-4">
                {/* Simplified Vitals Bar */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Beta</div>
                        <div className="text-sm font-black text-gray-900 dark:text-blue-400">{vitals.beta}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sectors</div>
                        <div className="text-sm font-black text-gray-900 dark:text-emerald-400">{vitals.uniqueSectors}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk</div>
                        <div className="text-sm font-black text-gray-900 dark:text-orange-400">{vitals.maxConcentration.toFixed(0)}%</div>
                    </div>
                </div>

                {/* Primary Toggles */}
                <div className="flex bg-gray-200/50 dark:bg-slate-700/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'workspace'
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Performance
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'analysis'
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Deep Intelligence
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'workspace' && (
                    <div className="h-full flex flex-col p-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex-1 min-h-0">
                            <PortfolioPerformanceChart history={portfolioHistory} />
                        </div>
                        <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Brain size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Portfolio Verdict</div>
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                    Your portfolio shows strong sector diversity with {vitals.uniqueSectors} slots active. Alpha momentum is neutral.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {/* Integrated Analysis Feed */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle size={16} className="text-orange-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Risk Assessment</h4>
                            </div>
                            <div className="h-[280px]">
                                <PortfolioRiskAnalysis
                                    holdings={holdings}
                                    stocks={stocks}
                                    totalValue={portfolio.totalValue}
                                />
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} className="text-purple-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Strategy Performance</h4>
                            </div>
                            <div className="h-[320px]">
                                <StrategyAnalytics orders={orders} />
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Newspaper size={16} className="text-emerald-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Market News Context</h4>
                            </div>
                            <PortfolioNews holdings={holdings} />
                        </section>
                    </div>
                )}
            </div>

            {/* Footer Workspace Info */}
            <div className="bg-gray-50/10 px-4 py-2 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-500" /> System Secure</span>
                    <span>Ready to Commit</span>
                </div>
                <span>Sync Node: ALPHA-TRADER-NODE</span>
            </div>
        </div>
    );
};
