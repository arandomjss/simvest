import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Mail, Lock, Zap, ArrowRight, Eye, EyeOff, 
  CandlestickChart, Landmark, TrendingUp, Coins, UserPlus 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
            opacity: [0.1, 0.2, 0.1],
            y: [y, y - 20, y],
            rotate: [0, -10, 10, 0]
        }}
        transition={{ 
            duration: 9, 
            repeat: Infinity, 
            delay,
            ease: "easeInOut" 
        }}
        className="absolute text-slate-300 pointer-events-none"
        style={{ left: `${x}%`, top: `${y}%` }}
    >
        <Icon size={40} />
    </motion.div>
);

const ShimmerButton = ({ onClick, children, className = "" }: any) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden group ${className}`}
    >
        {/* Shimmer Effect */}
        <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "200%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/2 bg-white/20 skew-x-[45deg] z-10 pointer-events-none"
        />
        <div className="relative z-20 flex items-center justify-center gap-2">
            {children}
        </div>
    </button>
);

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, error, isLoading, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {}
    };

    const handleQuickStart = () => {
        useAuthStore.setState({
            user: { id: 'dev-user-123', email: 'dev@simvest.com' },
            isAuthenticated: true,
            isLoading: false,
            error: null
        });
        localStorage.setItem('supabase.auth.token', 'mock-token-dev');
        navigate('/dashboard');
    };

    return (
        <div className="h-screen w-full bg-[#F8FAFC] font-sans transition-colors duration-500 flex flex-col justify-center relative overflow-hidden text-slate-900">
            <Helmet>
                <title>Login | SimVest</title>
            </Helmet>

            {/* Background Layer: Grid & Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[140px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Floating Particles */}
                <FloatingIcon icon={CandlestickChart} x={25} y={15} delay={1} />
                <FloatingIcon icon={Landmark} x={75} y={25} delay={3} />
                <FloatingIcon icon={TrendingUp} x={15} y={80} delay={5} />
                <FloatingIcon icon={Coins} x={85} y={75} delay={2} />
            </div>

            <main className="relative z-10 w-full max-w-[440px] mx-auto px-6 py-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Brand Header */}
                    <div className="flex flex-col items-center mb-6">
                        <Link to="/" className="flex items-center gap-2 mb-3 group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-2xl transform transition-transform group-hover:scale-105">
                                <img src="/logo-light.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">SimVest</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                        <p className="text-slate-500 text-sm mt-1">Terminal connection initialized.</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-6 rounded-[32px] shadow-2xl shadow-blue-500/5">
                        
                        {/* Shimmer Quick Start */}
                        <ShimmerButton
                            onClick={handleQuickStart}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mb-8 overflow-hidden"
                        >
                            <Zap size={20} className="fill-current text-yellow-400" />
                            <span>Quick Access Terminal</span>
                        </ShimmerButton>

                        <div className="relative mb-8 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <span className="relative px-3 bg-[#F8FAFC] text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Credentials Login</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Account Identifier</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="terminal@simvest.com"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Access Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Sign In <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs">
                            <span className="text-slate-400 font-bold">New operator? </span>
                            <Link to="/register" className="text-blue-500 font-bold hover:underline">Register Identity</Link>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-4 text-slate-300 grayscale opacity-40">
                        <UserPlus size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Simulation Technology®</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
