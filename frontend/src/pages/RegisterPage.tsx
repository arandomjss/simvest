import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  ShieldCheck, Mail, Lock, UserPlus, ArrowRight, Eye, EyeOff, 
  Check, CandlestickChart, Landmark, TrendingUp, Coins 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const PasswordStrength = ({ password }: { password: string }) => {
    const strength = useMemo(() => {
        if (!password) return 0;
        let s = 0;
        if (password.length > 6) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    }, [password]);

    const getColor = (step: number) => {
        if (strength >= step) {
            if (strength <= 1) return 'bg-red-500';
            if (strength <= 2) return 'bg-yellow-500';
            if (strength >= 3) return 'bg-emerald-500';
        }
        return 'bg-slate-200';
    };

    return (
        <div className="flex gap-1 mt-2 px-1">
            {[1, 2, 3, 4].map(step => (
                <div key={step} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${getColor(step)}`} />
            ))}
        </div>
    );
};

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
            opacity: [0.1, 0.2, 0.1],
            y: [y, y - 20, y],
            rotate: [0, 10, -10, 0]
        }}
        transition={{ 
            duration: 8, 
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

export const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const { signUp, error, isLoading, clearError } = useAuthStore();
    const navigate = useNavigate();

    const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        try {
            await signUp(email, password);
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                const { signIn } = useAuthStore.getState();
                await signIn(email, password);
                navigate('/dashboard');
            } catch (loginErr) {
                alert('Registration successful! You can now log in.');
                navigate('/login');
            }
        } catch (err) {}
    };

    const displayError = localError || error;

    return (
        <div className="h-screen w-full bg-[#F8FAFC] font-sans transition-colors duration-500 flex flex-col justify-center relative overflow-hidden text-slate-900">
            <Helmet>
                <title>Create Account | SimVest</title>
            </Helmet>

            {/* Background Layer: Grid & Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[140px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Floating Particles */}
                <FloatingIcon icon={CandlestickChart} x={15} y={20} delay={0} />
                <FloatingIcon icon={Landmark} x={85} y={15} delay={2} />
                <FloatingIcon icon={TrendingUp} x={10} y={75} delay={4} />
                <FloatingIcon icon={Coins} x={80} y={80} delay={1} />
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
                        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                        <p className="text-slate-500 text-sm mt-1">Free paper trading terminal.</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-6 rounded-[32px] shadow-2xl shadow-blue-500/5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Terminal</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@email.com"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Secure Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <PasswordStrength password={password} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Confirm Identity</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                    {doPasswordsMatch && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Check size={18} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {displayError && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                                        {displayError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Sign Up <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs">
                            <span className="text-slate-400 font-bold">Already part of the network? </span>
                            <Link to="/login" className="text-emerald-500 font-bold hover:underline">Sign In</Link>
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
