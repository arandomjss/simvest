import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight,
  Brain,
  Activity,
  Globe,
  Database,
  Zap,
  TrendingUp,
  MousePointer2,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { BackgroundSnippet } from '../components/ui/background-snippets';
import { MarketCore } from '../components/ui/market-core';
import '../styles/landing.css';

/** Mock Data for Ticker */
const TICKER_DATA = [
    { label: "NIFTY 50", price: "22,453.20", change: "+0.85%", up: true },
    { label: "SENSEX", price: "74,120.50", change: "+0.72%", up: true },
    { label: "RELIANCE", price: "2,984.10", change: "-0.40%", up: false },
    { label: "TCS", price: "3,842.00", change: "+1.20%", up: true },
    { label: "USD/INR", price: "83.12", change: "+0.05%", up: true },
    { label: "NIFTY BANK", price: "47,580.90", change: "-0.15%", up: false },
    { label: "HDFC BANK", price: "1,452.30", change: "+0.90%", up: true },
];

/** FAQ Data */
const FAQ_DATA = [
    { q: "Is SimVest genuinely free?", a: "Yes. All basic terminal features, including real-time charts and order execution simulation, are free for individual traders." },
    { q: "How accurate is the market data?", a: "We provide near real-time data compatible with major Indian exchanges (NSE/BSE), though execution is strictly a simulation." },
    { q: "Can I copy strategies from other traders?", a: "Soon. Our Social Terminal module is currently in beta, allowing users to share and follow peer portfolios." },
    { q: "Is my personal data secure?", a: "We use institutional-grade encryption and do not store any bank account details, as we do not handle real money." },
];

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
    <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

const FeatureItem = ({ icon: Icon, title, desc }: any) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group"
    >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Icon size={24} />
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

const FAQItem = ({ q, a }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="faq-item">
            <button onClick={() => setIsOpen(!isOpen)} className="faq-trigger group">
                <span className="group-hover:text-emerald-600 transition-colors">{q}</span>
                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="faq-content">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const LandingPage: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <div className="relative min-h-screen w-full font-sans transition-colors duration-500 overflow-x-hidden text-slate-900">
            <Helmet>
                <title>SimVest | The Professional Trading Simulation</title>
            </Helmet>

            {/* BackgroundSnippet for Hero Depth */}
            <BackgroundSnippet />

            {/* Top Market Ticker */}
            <div className="ticker-wrap sticky top-0 z-[100]">
                <div className="ticker-content">
                    {[...TICKER_DATA, ...TICKER_DATA].map((item, i) => (
                        <div key={i} className="ticker-item">
                            <span className="uppercase">{item.label}</span>
                            <span className="ticker-price">{item.price}</span>
                            <span className={`ticker-change ${item.up ? 'up' : 'down'}`}>
                                {item.up ? '▲' : '▼'} {item.change}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-9 h-9 rounded-lg overflow-hidden shadow-2xl">
                        <img src="/logo-light.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">SimVest</span>
                </div>
                
                <div className="flex items-center gap-4">
                    {user ? (
                        <Link to="/dashboard" className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold shadow-xl shadow-black/10 hover:scale-105 transition-all text-sm">
                            Enter Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="px-5 py-2 rounded-full bg-slate-900 text-white font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-all">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-12 px-6 pb-24 md:grid-cols-2">
                <div className="flex flex-col justify-center space-y-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest mb-6 border border-emerald-500/20">
                            <Zap size={14} className="fill-current" />
                            Live Terminal v3.0
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-slate-900">
                            Master the Indian <br />
                            <span className="text-emerald-600">
                                Stock Market.
                            </span>
                        </h1>
                        <p className="mt-8 max-w-lg text-lg text-slate-500 leading-relaxed">
                            SimVest provides institutional-grade tools to simulate real-time Indian indices. Refine your edge with zero financial risk.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link to="/register" className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95">
                            Start Trading Today <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link to="/practice" className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg shadow-xl shadow-black/5 border border-slate-100 hover:bg-slate-50 transition-all">
                            View Live Data
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 max-w-sm">
                        <Stat label="Total Assets" value="140+" />
                        <Stat label="Active Traders" value="52k" />
                    </div>
                </div>

                <div className="relative z-10 w-full flex justify-center items-center">
                    <MarketCore />
                </div>
            </header>

            {/* Features Ecosystem */}
            <section className="relative z-10 bg-white py-24 border-y border-slate-100">
                <div className="mx-auto max-w-[1240px] px-6">
                    <div className="text-center mb-16">
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">The Terminal</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-4 italic">Power Tools for Smart Operators.</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureItem 
                            icon={Database} 
                            title="Live Depth data" 
                            desc="Real-time Level 2 data simulation giving you exact bid/ask spreads."
                        />
                        <FeatureItem 
                            icon={Brain} 
                            title="AI Strategy Advisor" 
                            desc="Get machine-learning insights on NIFTY patterns and global trends."
                        />
                        <FeatureItem 
                            icon={Activity} 
                            title="Risk Analytics" 
                            desc="Visualized Drawdown, Sharpe Ratio, and Alpha tracking for your portfolio."
                        />
                        <FeatureItem 
                            icon={Globe} 
                            title="Global Gateways" 
                            desc="Connect seamlessly with international markets in our high-tier terminal."
                        />
                    </div>
                </div>
            </section>

            {/* How it Works / The Roadmap */}
            <section className="relative z-10 py-24 overflow-hidden">
                <div className="absolute left-[10%] top-0 bottom-0 w-px bg-slate-100 lg:block hidden" />
                <div className="mx-auto max-w-[1240px] px-6">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="lg:w-1/3 sticky top-32">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">The Process</span>
                            <h2 className="text-5xl font-bold text-slate-900 mt-4 leading-tight">Master the <br /> Terminal in <br /> Minutes.</h2>
                            <p className="text-slate-500 mt-6 leading-relaxed">We've built the world's most intuitive path for novice traders to become institutional-grade operators.</p>
                        </div>
                        
                        <div className="lg:w-2/3 space-y-24">
                            {[
                                { step: "01", title: "Initialize Identity", desc: "Create your free SimVest account in seconds. No KYC, no bank accounts, no friction.", icon: MousePointer2 },
                                { step: "02", title: "Fund & Simulate", desc: "Receive $1,000,000 in virtual capital instantly. Start placing market and limit orders.", icon: Database },
                                { step: "03", title: "Conquer Markets", desc: "Analyze your performance, refine your edge, and join our elite leaderboard.", icon: TrendingUp },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-8 relative">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl z-10">
                                        {item.step}
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h4>
                                        <p className="text-slate-500 max-w-md leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="relative z-10 py-24 bg-white border-t border-slate-100">
                <div className="mx-auto max-w-[1240px] px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Support</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-4 mb-8">Frequently Asked <br /> Questions.</h2>
                        <p className="text-slate-500 max-w-md">Everything you need to know about starting your paper trading journey on SimVest.</p>
                    </div>
                    <div className="faq-container">
                        {FAQ_DATA.map((item, i) => <FAQItem key={i} {...item} />)}
                    </div>
                </div>
            </section>

            {/* Final CTA Banner */}
            <section className="relative z-10 py-24 px-6 mx-auto max-w-[1240px]">
                <div className="cta-banner">
                    <h2 className="text-5xl font-bold text-white mb-6">Master the Markets. <br /> Zero Risk.</h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">Join 52,000+ traders already building their financial future with SimVest.</p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/register" className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-50 transition-all flex items-center gap-2">
                            Initialize Account <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 border-t border-slate-100 bg-white">
                <div className="mx-auto max-w-[1240px] px-6 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src="/logo-light.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">SimVest</span>
                    </div>
                    <div className="flex gap-12 text-sm font-bold text-slate-400 mb-12">
                        <Link to="/practice" className="hover:text-slate-900 transition-colors">Terminals</Link>
                        <Link to="/advisor" className="hover:text-slate-900 transition-colors">AI Insights</Link>
                        <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
                        <a href="mailto:support@simvest.com" className="hover:text-slate-900 transition-colors">Support</a>
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                        © 2026 SimVest Simulation Technology. All Terminal Rights Reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};
