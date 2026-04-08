import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap } from 'lucide-react';

const GlassPanel = ({ children, className, delay = 0, yOffset = 20 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: yOffset, rotateX: 5, rotateY: 5 }}
    animate={{ 
      opacity: 1, 
      y: [yOffset, yOffset - 15, yOffset],
      rotateX: [5, 0, 5],
      rotateY: [5, 10, 5]
    }}
    transition={{ 
      duration: 6, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay 
    }}
    className={`absolute backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
    {children}
  </motion.div>
);

export const MarketCore = () => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000 overflow-visible">
      
      {/* Central Hub */}
      <div className="relative z-10">
        {/* Pulsing Outer Rings */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-40px] rounded-full border border-emerald-500/30 blur-sm"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute inset-[-80px] rounded-full border border-blue-500/20 blur-md"
        />

        {/* Main Hub Disk */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-40 h-40 rounded-full bg-slate-900 flex items-center justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.3)] border border-emerald-500/20"
        >
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-emerald-500/10" />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-xl overflow-hidden shadow-2xl"
          >
            <img src="/logo-light.png" alt="Core" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>
      </div>

      {/* Panel Alpha: Returns */}
      <GlassPanel className="top-[5%] left-[5%] w-48" delay={0}>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Simulated Alpha</span>
        </div>
        <div className="text-2xl font-bold text-white">+12.4%</div>
        <div className="text-[10px] text-emerald-400 font-bold mt-1 tracking-tighter">WIN RATE: 78.5%</div>
      </GlassPanel>

      {/* Panel Beta: AI Status */}
      <GlassPanel className="bottom-[10%] right-[0%] w-56" delay={2} yOffset={40}>
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold">
                <Brain size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Market Intelligence</span>
        </div>
        <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: ["10%", "90%", "40%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-blue-300">
                <span>ANALYZING NIFTY...</span>
                <span className="animate-pulse">BETA v3</span>
            </div>
        </div>
      </GlassPanel>

      {/* Panel Gamma: Order Depth */}
      <GlassPanel className="top-[15%] right-[5%] w-40" delay={1} yOffset={-30}>
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Zap size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Live Depth</span>
        </div>
        <div className="space-y-1">
            {[0.8, 0.4, 0.6, 0.9, 0.3].map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="h-1 bg-rose-500/40 rounded-full" style={{ width: `${val * 40}%` }} />
                    <div className="ml-auto h-1 bg-emerald-500/40 rounded-full" style={{ width: `${(1-val) * 40}%` }} />
                </div>
            ))}
        </div>
      </GlassPanel>

      {/* Decorative SVG Paths (Connectors) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M 50 50 L 20 15"
          stroke="url(#grad1)"
          strokeWidth="0.2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
        />
        <motion.path
          d="M 50 50 L 85 85"
          stroke="url(#grad2)"
          strokeWidth="0.2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", delay: 1 }}
        />
        <defs>
          <linearGradient id="grad1" x1="0.5" y1="0.5" x2="0.2" y2="0.15">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="grad2" x1="0.5" y1="0.5" x2="0.85" y2="0.85">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
