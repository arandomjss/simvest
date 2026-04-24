import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
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

    const getLabel = () => {
        if (!password) return '';
        if (strength <= 1) return 'Weak';
        if (strength <= 2) return 'Fair';
        if (strength === 3) return 'Good';
        return 'Strong';
    };

    return (
        <div className="mt-2 px-0.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${getColor(step)}`} />
                ))}
            </div>
            {password && (
                <p className={`text-[10px] font-semibold mt-1 ml-0.5 ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                    {getLabel()} password
                </p>
            )}
        </div>
    );
};

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
            setLocalError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters.');
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
                alert('Account created! You can now log in.');
                navigate('/login');
            }
        } catch (err) {}
    };

    const displayError = localError || error;

    return (
        <div className="relative h-screen w-full font-sans bg-slate-50 flex flex-col justify-center overflow-hidden text-slate-900">
            <Helmet>
                <title>Create Account | SimVest</title>
            </Helmet>

            {/* Same subtle background as Login */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:64px_64px] opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-transparent to-blue-50/20 pointer-events-none" />

            <main className="relative z-10 w-full max-w-[440px] mx-auto px-6 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                    {/* Brand Header */}
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg transform transition-transform group-hover:scale-105">
                                <img src="/logo-light.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">SimVest</span>
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
                        <p className="text-slate-500 text-sm mt-1">Free paper trading. No credit card needed.</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white border border-slate-200 p-7 rounded-3xl shadow-xl shadow-slate-200/60">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">Email address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <PasswordStrength password={password} />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">Confirm password</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
                                    />
                                    {doPasswordsMatch && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {displayError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-center"
                                    >
                                        {displayError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all group mt-2"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-emerald-300 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Create account <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm">
                            <span className="text-slate-500">Already have an account? </span>
                            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">Sign in</Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

