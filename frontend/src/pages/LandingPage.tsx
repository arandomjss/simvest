import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import '../styles/landing.css';

/** Stat Component for Hero area */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
    <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

/** Animated Mini Bars for Growth Card */
function MiniBars() {
  return (
    <div className="mt-6 flex h-36 items-end gap-3 rounded-xl bg-gradient-to-b from-emerald-50 to-white p-4 shadow-inner">
      {[18, 48, 72, 96, 64, 88].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0, opacity: 0.6 }}
          animate={{ height: h }}
          transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
          className="flex-1 rounded-lg bg-gradient-to-t from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/20"
        />
      ))}
    </div>
  );
}

/** Animated Planet SVG for Markets Card */
function Planet() {
  return (
    <motion.svg
      initial={{ rotate: -8, scale: 0.9 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ duration: 2, type: "spring" }}
      width="240"
      height="240"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="planet-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="64" fill="url(#planet-grad)" opacity="0.9" />
      <circle cx="85" cy="90" r="12" fill="white" opacity="0.3" />
      <circle cx="130" cy="130" r="8" fill="white" opacity="0.2" />
      <motion.ellipse
        cx="110" cy="110" rx="100" ry="32" stroke="white" strokeOpacity="0.5" fill="none"
        animate={{ strokeDashoffset: [240, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} strokeDasharray="120 120"
      />
      <motion.circle cx="210" cy="110" r="4" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }} />
    </motion.svg>
  );
}

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] font-sans transition-colors duration-500 overflow-x-hidden text-slate-900">
      <Helmet>
        <title>SimVest | Master the Markets Without the Risk</title>
        <meta name="description" content="SimVest is the ultimate paper trading terminal. Build your portfolio, hone strategies, and master the art of trading." />
      </Helmet>

      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[35%] h-[35%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-2xl shadow-primary/20 transform transition-transform group-hover:scale-105">
            <img 
              src="/logo-light.png" 
              alt="SimVest Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">SimVest</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold shadow-xl shadow-black/10 hover:scale-105 transition-all text-sm">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold shadow-xl shadow-black/10 hover:scale-105 transition-all text-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 px-6 pb-24 pt-12 md:grid-cols-2">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col justify-center space-y-10"
        >
          <div>
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-6 ring-1 ring-emerald-500/20"
            >
              <Zap size={14} className="fill-current" />
              Next-Gen Paper Trading
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-slate-900"
            >
              Master the Markets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                Without the Risk.
              </span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-8 max-w-lg text-lg lg:text-xl text-slate-600 leading-relaxed"
            >
              SimVest gives you institutional-grade tools to trade Indian markets in real-time. Practice strategies, track performance, and sharpen your edge.
            </motion.p>
          </div>

          <motion.div 
            variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
            className="flex items-center gap-4"
          >
            {user ? (
               <Link to="/dashboard" className="group flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95">
               Continue to Dashboard <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="group flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95">
                  Start Trading for Free <ArrowUpRight size={22} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
                <Link to="/practice" className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg shadow-xl shadow-black/5 ring-1 ring-slate-200 hover:bg-slate-50 transition-all">
                  Try Demo
                </Link>
              </>
            )}
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 max-w-sm"
          >
            <Stat label="Live Indices" value="140+" />
            <Stat label="Total Volume" value="$1.2B" />
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5 } }}
            className="flex items-center gap-8"
          >
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Powering Traders</span>
            <div className="flex gap-8 items-center text-slate-400 opacity-50 grayscale contrast-125">
              <span className="font-bold text-xl tracking-tighter">NSE</span>
              <span className="font-bold text-xl tracking-tighter">BSE</span>
              <span className="font-bold text-xl tracking-tighter">MCX</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start self-center lg:pl-12">
          {/* Pro-Grade Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 rounded-3xl bg-slate-900 p-8 shadow-2xl relative overflow-hidden"
          >
             {/* Abstract Grid background */}
             <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
            
            <div className="relative h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">Institutional-Grade</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                Secure & Precise <br /> Simulation.
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience ultra-low latency execution and real market dynamics without risks.
              </p>
            </div>
          </motion.div>

          {/* Markets Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden group h-[300px]"
          >
            <div className="absolute -right-16 -top-16 opacity-80 transition-transform group-hover:scale-110 duration-700">
              <Planet />
            </div>
            <div className="relative mt-24">
              <div className="text-xs font-bold text-blue-100 uppercase tracking-[0.2em] mb-3">Markets</div>
              <h3 className="text-2xl font-bold text-white leading-snug">
                140+ Currencies <br /> and Global Indices.
              </h3>
            </div>
          </motion.div>

          {/* Analytics Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="col-span-1 md:col-span-1 rounded-3xl bg-white p-8 shadow-2xl shadow-blue-500/5 ring-1 ring-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shadow-sm ring-1 ring-blue-500/20">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Strategy Analytics</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-slate-900">$50,240</span>
              <span className="text-sm font-bold text-slate-400">USD</span>
            </div>
            <div className="text-sm font-bold text-emerald-500 mb-6">+2.4% <span className="text-slate-400 font-medium">Growth Today</span></div>
            <MiniBars />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-16 mt-12 bg-white transition-colors">
        <div className="mx-auto max-w-[1240px] px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
               <img 
                  src="/logo-light.png" 
                  alt="SimVest Logo" 
                  className="w-full h-full object-cover" 
                />
            </div>
            <span className="text-xl font-bold text-slate-900">SimVest</span>
          </div>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            Providing traders with the ultimate environment to master the markets without financial risk.
          </p>
          <div className="flex justify-center gap-8 mb-12">
            <Link to="/practice" className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors">Markets</Link>
            <Link to="/advisor" className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors">Strategies</Link>
            <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors">Login</Link>
            <a href="mailto:support@simvest.com" className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <div className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">
            © 2026 SimVest. Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
