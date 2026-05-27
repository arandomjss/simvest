import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    User, AtSign, Phone, ChevronRight, ChevronLeft,
    TrendingUp, Target, Shield, CheckCircle2,
    Rocket, Zap, BookOpen, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// ─── Capital per experience level ────────────────────────────────────────────
const CAPITAL_MAP: Record<string, { amount: number; label: string; color: string }> = {
    Beginner:     { amount: 100000,   label: '₹1,00,000',  color: 'text-sky-500 dark:text-sky-400' },
    Intermediate: { amount: 500000,   label: '₹5,00,000',  color: 'text-violet-500 dark:text-violet-400' },
    Advanced:     { amount: 1000000,  label: '₹10,00,000', color: 'text-emerald-500 dark:text-emerald-400' },
    Expert:       { amount: 2500000,  label: '₹25,00,000', color: 'text-amber-500 dark:text-amber-400' },
};

// ─── Option pill component (Vertical Layout Blocks - Expanded Size) ───────────
const Pill = ({
    label, selected, onClick, icon: Icon, sub
}: { label: string; selected: boolean; onClick: () => void; icon?: any; sub?: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative flex flex-row items-center justify-start text-left gap-4 w-full py-[18px] px-5 rounded-2xl border-2 transition-all duration-300 group active:scale-[0.97] hover:scale-[1.02] hover:-translate-y-0.5
            ${selected
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5'
                : 'border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none'
            }`}
    >
        {selected && (
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-5 top-1/2 -translate-y-1/2"
            >
                <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" />
            </motion.div>
        )}
        {Icon && (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0
                ${selected 
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                <Icon size={19} />
            </div>
        )}
        <div className="space-y-0.5 pr-12 min-w-0">
            <span className="block text-sm md:text-base font-black tracking-tight leading-tight">{label}</span>
            {sub && <span className={`block text-[11px] md:text-xs font-semibold transition-colors duration-300 ${selected ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`}>{sub}</span>}
        </div>
    </button>
);

// ─── Step indicator progress bar ──────────────────────────────────────────────
const Steps = ({ current, total }: { current: number; total: number }) => {
    const percent = ((current + 1) / total) * 100;
    return (
        <div className="w-full space-y-2.5 mb-8">
            <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account Setup</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Math.round(percent)}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
            </div>
        </div>
    );
};

// ─── Checkbox row ─────────────────────────────────────────────────────────────
const CheckRow = ({ checked, onChange, children }: {
    checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode
}) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex items-start gap-4 w-full p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-300 active:scale-[0.99]
            ${checked 
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' 
                : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
    >
        <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300
            ${checked ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600' : 'border-slate-300 dark:border-slate-600'}`}>
            {checked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{children}</span>
    </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const OnboardingPage = () => {
    const navigate = useNavigate();
    const { user, checkAuth, signOut } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Step 1 — Identity
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');

    // Step 2 — Trader Profile
    const [experienceLevel, setExperienceLevel] = useState('Beginner');
    const [tradingGoal, setTradingGoal] = useState('');
    const [riskPreference, setRiskPreference] = useState('');
    const [tradingCommitment, setTradingCommitment] = useState('');

    // Step 3 — Agreements
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const STEPS = ['Your Identity', 'Trader Profile', 'Final Step'];
    const capital = CAPITAL_MAP[experienceLevel] ?? CAPITAL_MAP['Beginner'];

    const handleUsernameChange = (v: string) => {
        setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30));
    };

    const handleBackToLogin = async () => {
        setIsSaving(true);
        try {
            await signOut();
            toast.success('Signed out successfully.');
            navigate('/login', { replace: true });
        } catch (err: any) {
            toast.error(err.message || 'Failed to sign out.');
        } finally {
            setIsSaving(false);
        }
    };

    const canProceedStep0 = fullName.trim().length >= 2 && username.trim().length >= 3;
    const canProceedStep1 = tradingGoal && riskPreference && tradingCommitment;
    const canProceedStep2 = termsAccepted && privacyAccepted && disclaimerAccepted;

    const handleNext = () => {
        if (step === 0 && !canProceedStep0) {
            toast.error('Please enter your name and a username (min 3 chars).');
            return;
        }
        if (step === 1 && !canProceedStep1) {
            toast.error('Please fill in all trading preferences.');
            return;
        }
        setStep(s => s + 1);
    };

    const handleFinish = async () => {
        if (!canProceedStep2) {
            toast.error('Please accept all agreements to continue.');
            return;
        }
        if (!user) return;

        setIsSaving(true);
        try {
            const startingBalance = capital.amount;

            // 1. Save profile metadata to Supabase auth
            const { error: metaError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName.trim(),
                    username: username.trim(),
                    phone_optional: phone.trim(),
                    experience_level: experienceLevel,
                    trading_goal: tradingGoal,
                    risk_preference: riskPreference,
                    trading_commitment: tradingCommitment,
                    leaderboard_visibility: true,
                    notification_preferences: true,
                    terms_accepted: true,
                    privacy_policy_accepted: true,
                    paper_trading_disclaimer_accepted: true,
                    starting_virtual_balance: startingBalance,
                    onboarding_completed: true,
                    onboarding_completed_at: new Date().toISOString(),
                }
            });
            if (metaError) throw metaError;

            // 2. Update the actual virtual_balance in the profiles table
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ virtual_balance: startingBalance })
                .eq('id', user.id);

            if (balanceError) {
                console.warn('Balance update warning:', balanceError.message);
            }

            // 3. Refresh auth state
            await checkAuth();

            toast.success(`Welcome aboard, ${fullName.split(' ')[0]}! 🎉`);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
    };

    const [direction, setDirection] = useState(1);
    const goNext = () => { setDirection(1); handleNext(); };
    const goBack = () => { setDirection(-1); setStep(s => s - 1); };

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden">
            <Helmet>
                <title>Set Up Your Account | SimVest</title>
            </Helmet>

            {/* Glowing background ambient orbs */}
            <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-1/4 right-1/10 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[140px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />

            {/* Micro-dot tech grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-60 pointer-events-none -z-10" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-5xl mx-auto w-full border-b border-slate-200/50 dark:border-slate-800/40">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md">
                        <img src="/logo-light.png" alt="SimVest" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SimVest</span>
                </div>
                <div className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-bold">
                    Step {step + 1} of {STEPS.length} — {STEPS[step]}
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-5xl space-y-6">
                    
                    {/* Setup Stepper Progress Bar Panel */}
                    <div className="relative py-2">
                        <Steps current={step} total={STEPS.length} />
                    </div>

                    <AnimatePresence mode="wait" custom={direction}>
                        {/* ─── STEP 0: Identity (Modular 2-Column Panels) ────── */}
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch py-2"
                            >
                                {/* Left Side Welcome Panel */}
                                <div className="md:border-r border-slate-200/40 dark:border-slate-800/40 md:pr-10 flex flex-col justify-center space-y-5">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Zap size={24} />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Welcome to SimVest</h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        You're just a few steps away from your professional paper trading terminal. Let's create your virtual profile to start practicing.
                                    </p>
                                    <div className="space-y-3 pt-3">
                                        {[
                                            'Get ₹1L to ₹25L virtual starting balance',
                                            'Practice with real-time market data',
                                            'Track performance and build trading habits'
                                        ].map((text, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-400 font-bold">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                                <span>{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side Inputs Panel */}
                                <div className="flex flex-col justify-center space-y-5">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Full Name <span className="text-red-400">*</span></label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                id="onboarding-full-name"
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder="e.g. Arjun Sharma"
                                                maxLength={60}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:focus:border-emerald-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Username <span className="text-red-400">*</span></label>
                                        <div className="relative group">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                id="onboarding-username"
                                                type="text"
                                                value={username}
                                                onChange={e => handleUsernameChange(e.target.value)}
                                                placeholder="e.g. arjun_trades"
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:focus:border-emerald-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 ml-0.5 leading-relaxed font-medium">Lowercase, numbers and underscores only. This appears on leaderboards.</p>
                                    </div>

                                    {/* Phone (optional) */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Phone <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span></label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                id="onboarding-phone"
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="+91 98765 43210"
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:focus:border-emerald-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 1: Trader Profile (Modular Card Panels) ────── */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2"
                            >
                                {/* Left Column: Experience + Risk */}
                                <div className="space-y-6">
                                    {/* Experience Level Panel */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-700/30">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Experience Level</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Setup</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { val: 'Beginner', icon: BookOpen, sub: '₹1L Cap' },
                                                { val: 'Intermediate', icon: TrendingUp, sub: '₹5L Cap' },
                                                { val: 'Advanced', icon: Zap, sub: '₹10L Cap' },
                                                { val: 'Expert', icon: Rocket, sub: '₹25L Cap' },
                                            ].map(({ val, icon, sub }) => (
                                                <Pill
                                                    key={val}
                                                    label={val}
                                                    sub={sub}
                                                    icon={icon}
                                                    selected={experienceLevel === val}
                                                    onClick={() => setExperienceLevel(val)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risk Appetite Panel */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-700/30">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Risk Appetite</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Parameter</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { val: 'Conservative', icon: Shield },
                                                { val: 'Moderate', icon: Target },
                                                { val: 'Aggressive', icon: Zap },
                                            ].map(({ val, icon }) => (
                                                <Pill key={val} label={val} icon={icon} selected={riskPreference === val} onClick={() => setRiskPreference(val)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Goal + Commitment */}
                                <div className="space-y-6">
                                    {/* Trading Goal Panel */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-700/30">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Trading Goal</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Profile</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { val: 'Appreciation', icon: TrendingUp, sub: 'Grow wealth' },
                                                { val: 'Income', icon: DollarSign, sub: 'Regular return' },
                                                { val: 'Learning', icon: BookOpen, sub: 'Build skills' },
                                                { val: 'Preservation', icon: Shield, sub: 'Protect asset' },
                                            ].map(({ val, icon, sub }) => (
                                                <Pill key={val} label={val} sub={sub} icon={icon} selected={tradingGoal === val} onClick={() => setTradingGoal(val)} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Trading Commitment Panel */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-700/30">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Practice Commitment</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Routine</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { val: 'Part-Time', icon: BookOpen, sub: '15-30m/d' },
                                                { val: 'Active', icon: TrendingUp, sub: '1-2h/d' },
                                                { val: 'Full-Time', icon: Rocket, sub: '2h+/d' },
                                            ].map(({ val, icon, sub }) => (
                                                <Pill key={val} label={val} icon={icon} sub={sub} selected={tradingCommitment === val} onClick={() => setTradingCommitment(val)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 2: Agreements (Modular 2-Column Summary Panels) ────── */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch py-2"
                            >
                                {/* Left Column: Custom structured Account Receipt Card */}
                                <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
                                    <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account Receipt</p>
                                        <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-extrabold uppercase">Ready</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs md:text-sm text-slate-700 dark:text-slate-300">
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Name</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">{fullName || '—'}</span></div>
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Username</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">@{username || '—'}</span></div>
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Experience</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">{experienceLevel}</span></div>
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Trading Goal</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">{tradingGoal || '—'}</span></div>
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Risk Profile</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">{riskPreference || '—'}</span></div>
                                        <div className="min-w-0"><span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Commitment</span><span className="font-extrabold text-slate-900 dark:text-white truncate block">{tradingCommitment || '—'}</span></div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs md:text-sm">
                                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Starting Balance</span>
                                        <span className={`font-black ${capital.color} text-base`}>{capital.label}</span>
                                    </div>
                                </div>

                                {/* Right Column: Agreements Panel */}
                                <div className="flex flex-col justify-center space-y-4">
                                    <CheckRow checked={termsAccepted} onChange={setTermsAccepted}>
                                        I agree to the <span className="text-emerald-600 dark:text-emerald-400 font-bold">Terms of Service</span>. SimVest is for educational purposes only.
                                    </CheckRow>
                                    <CheckRow checked={privacyAccepted} onChange={setPrivacyAccepted}>
                                        I have read and accept the <span className="text-emerald-600 dark:text-emerald-400 font-bold">Privacy Policy</span>.
                                    </CheckRow>
                                    <CheckRow checked={disclaimerAccepted} onChange={setDisclaimerAccepted}>
                                        I understand this is a <span className="text-emerald-600 dark:text-emerald-400 font-bold">paper trading platform</span>. All trades use virtual money.
                                    </CheckRow>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Navigation Control Bar ────────────────── */}
                    <div className="border-t border-slate-200/40 dark:border-slate-700/40 mt-8 pt-6 flex items-center justify-between gap-4">
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold text-xs md:text-sm hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-95 transition-all"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold text-xs md:text-sm hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} /> Back to Login
                            </button>
                        )}

                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/20 dark:shadow-none hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 transition-all group"
                            >
                                Continue <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={isSaving || !canProceedStep2}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/20 dark:shadow-none hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                            >
                                {isSaving ? (
                                    <><div className="w-4 h-4 border-2 border-emerald-300 border-t-white rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><Rocket size={16} /> Start Trading</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-6 text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">
                Your data is secure and never shared with third parties.
            </footer>
        </div>
    );
};
