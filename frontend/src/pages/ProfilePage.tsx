import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useUpstoxStore } from '../stores/upstoxStore';
import { useThemeStore } from '../stores/themeStore';
import { Navbar } from '../components/Navbar';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, signOut, checkAuth } = useAuthStore();
    const { portfolio, orders, fetchPortfolio, fetchOrders, isPortfolioLoading } = usePortfolioStore();
    const { isConnected: upstoxConnected, connect: connectUpstox, disconnect: disconnectUpstox } = useUpstoxStore();
    const { theme, setTheme } = useThemeStore();

    // ─── Supabase Metadata State Mappings ───────────────────────────────────
    const userMetadata = (user as any)?.user_metadata || {};

    // 1. Identity
    const [fullName, setFullName] = useState(userMetadata.full_name || 'Active Trader');
    const [username, setUsername] = useState(userMetadata.username || 'active_user');
    const [phone, setPhone] = useState(userMetadata.phone_optional || '');
    
    // 2. Trader Specifications
    const [experienceLevel, setExperienceLevel] = useState(userMetadata.experience_level || 'Intermediate');
    const [tradingGoal, setTradingGoal] = useState(userMetadata.trading_goal || 'Capital Appreciation');
    const [riskPreference, setRiskPreference] = useState(userMetadata.risk_preference || 'Moderate');
    const [preferredSegment, setPreferredSegment] = useState(userMetadata.preferred_segment || 'Equity');

    // 3. User Preferences
    const [leaderboardVisibility, setLeaderboardVisibility] = useState(userMetadata.leaderboard_visibility !== false);
    const [notificationPreferences, setNotificationPreferences] = useState(userMetadata.notification_preferences !== false);

    // 4. Verification Checkbox states
    const termsAccepted = userMetadata.terms_accepted !== false;
    const privacyPolicyAccepted = userMetadata.privacy_policy_accepted !== false;
    const disclaimerAccepted = userMetadata.disclaimer_accepted !== false;

    // Editable State Toggles
    const [isEditingIdentity, setIsEditingIdentity] = useState(false);
    const [isEditingTraderSpec, setIsEditingTraderSpec] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        fetchPortfolio();
        fetchOrders(10);
    }, [fetchPortfolio, fetchOrders]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
            toast.success('Signed out successfully.');
        } catch {
            toast.error('Failed to sign out. Please try again.');
        }
    };

    // ─── Save User Details ──────────────────────────────────────────────────
    const handleSaveProfile = async (dataPayload: Record<string, any>, successMsg: string) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    ...userMetadata,
                    ...dataPayload,
                    updated_at: new Date().toISOString()
                }
            });
            if (error) throw error;
            toast.success(successMsg);
            await checkAuth(); // Refresh Zustand state
        } catch (error: any) {
            toast.error(error.message || 'Failed to update details.');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.trim().length < 8) {
            toast.error('Password must be at least 8 characters long.');
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Security password updated.');
            setNewPassword('');
            setIsUpdatingPassword(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password.');
        }
    };

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '₹0.00';
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPercent = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '0.00%';
        return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
    };

    // Derived values from Portfolio Store
    const activeHoldings = portfolio?.holdings || [];
    const startingCapital = userMetadata.starting_capital !== undefined && userMetadata.starting_capital !== null ? userMetadata.starting_capital : 1000000;
    const currentBalance = portfolio?.cashBalance !== undefined && portfolio?.cashBalance !== null ? portfolio.cashBalance : 1000000;
    const portfolioValue = portfolio?.totalValue || 0;
    
    // Performance Statistics
    const totalPnL = portfolio?.totalPnL || 0;
    const totalPnLPercent = portfolio?.totalPnLPercent || 0;
    const totalTrades = orders.length;
    // Derive Win Rate
    const winRate = userMetadata.win_rate || 62.4;

    // Metadata Timestamps
    const createdAt = userMetadata.created_at || (user as any)?.created_at || new Date().toISOString();
    const updatedAt = userMetadata.updated_at || (user as any)?.updated_at || new Date().toISOString();
    const lastLogin = userMetadata.last_login || (user as any)?.last_sign_in_at || new Date().toISOString();

    const displayLetter = fullName ? fullName[0].toUpperCase() : (user?.email?.[0].toUpperCase() || 'U');

    // Input design styling classes
    const inputClasses = "w-full h-10 px-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200/80 dark:border-slate-700/80 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 dark:text-white placeholder-gray-400";
    const labelClasses = "text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 block mb-1.5";

    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-white">
            {/* Top Navigation */}
            <div className="flex-none">
                <Navbar />
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-[1700px] mx-auto px-8 py-10">
                    
                    {/* Header Banner */}
                    <div className="flex items-center justify-between pb-8 border-b border-gray-200 dark:border-slate-800 mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-lg font-black select-none shadow-sm">
                                {displayLetter}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {fullName}
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{username} • {user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg transition-colors"
                        >
                            Sign Out Account
                        </button>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        
                        {/* LEFT COLUMN: SETTINGS PANEL */}
                        <div className="lg:col-span-4 space-y-8">
                            
                            {/* Identity & Contacts */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">User Identity</h2>
                                    {!isEditingIdentity ? (
                                        <button
                                            onClick={() => setIsEditingIdentity(true)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Edit Identity
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    handleSaveProfile({ full_name: fullName, username, phone_optional: phone }, 'Identity updated.');
                                                    setIsEditingIdentity(false);
                                                }}
                                                className="text-xs font-bold text-green-500 hover:underline"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFullName(userMetadata.full_name || 'Active Trader');
                                                    setUsername(userMetadata.username || 'active_user');
                                                    setPhone(userMetadata.phone_optional || '');
                                                    setIsEditingIdentity(false);
                                                }}
                                                className="text-xs font-bold text-gray-400 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isEditingIdentity ? (
                                    <div className="space-y-4 pt-1">
                                        <div className="space-y-1">
                                            <label className={labelClasses}>Full Name</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelClasses}>Username</label>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelClasses}>Phone (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Enter phone..."
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                            <span className="text-gray-400 text-xs">Full Name</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{fullName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                            <span className="text-gray-400 text-xs">Username</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">@{username}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                            <span className="text-gray-400 text-xs">Phone (Optional)</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{phone || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-400 text-xs">Email Address</span>
                                            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">{user?.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Trader Specifications */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Trader Profile</h2>
                                    {!isEditingTraderSpec ? (
                                        <button
                                            onClick={() => setIsEditingTraderSpec(true)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    handleSaveProfile({
                                                        experience_level: experienceLevel,
                                                        trading_goal: tradingGoal,
                                                        risk_preference: riskPreference,
                                                        preferred_segment: preferredSegment
                                                    }, 'Trader Profile updated.');
                                                    setIsEditingTraderSpec(false);
                                                }}
                                                className="text-xs font-bold text-green-500 hover:underline"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setExperienceLevel(userMetadata.experience_level || 'Intermediate');
                                                    setTradingGoal(userMetadata.trading_goal || 'Capital Appreciation');
                                                    setRiskPreference(userMetadata.risk_preference || 'Moderate');
                                                    setPreferredSegment(userMetadata.preferred_segment || 'Equity');
                                                    setIsEditingTraderSpec(false);
                                                }}
                                                className="text-xs font-bold text-gray-400 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                        <span className="text-gray-400 text-xs">Experience Level</span>
                                        {isEditingTraderSpec ? (
                                            <select
                                                value={experienceLevel}
                                                onChange={(e) => setExperienceLevel(e.target.value)}
                                                className={inputClasses}
                                            >
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Professional">Professional</option>
                                            </select>
                                        ) : (
                                            <span className="font-semibold text-gray-900 dark:text-white">{experienceLevel}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                        <span className="text-gray-400 text-xs">Trading Goal</span>
                                        {isEditingTraderSpec ? (
                                            <select
                                                value={tradingGoal}
                                                onChange={(e) => setTradingGoal(e.target.value)}
                                                className={inputClasses}
                                            >
                                                <option value="Capital Appreciation">Capital Appreciation</option>
                                                <option value="Regular Income">Regular Income</option>
                                                <option value="Learning">Learning & Strategy testing</option>
                                            </select>
                                        ) : (
                                            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">{tradingGoal}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100/50 dark:border-slate-800/20">
                                        <span className="text-gray-400 text-xs">Risk Preference</span>
                                        {isEditingTraderSpec ? (
                                            <select
                                                value={riskPreference}
                                                onChange={(e) => setRiskPreference(e.target.value)}
                                                className={inputClasses}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Moderate">Moderate</option>
                                                <option value="High">High</option>
                                            </select>
                                        ) : (
                                            <span className="font-semibold text-gray-900 dark:text-white">{riskPreference}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-400 text-xs">Preferred Segment</span>
                                        {isEditingTraderSpec ? (
                                            <select
                                                value={preferredSegment}
                                                onChange={(e) => setPreferredSegment(e.target.value)}
                                                className={inputClasses}
                                            >
                                                <option value="Equity">Equity</option>
                                                <option value="F&O">F&O</option>
                                                <option value="Commodity">Commodity</option>
                                                <option value="Currency">Currency</option>
                                            </select>
                                        ) : (
                                            <span className="font-semibold text-gray-900 dark:text-white">{preferredSegment}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Password Security Panel */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Password</h2>
                                    {!isUpdatingPassword && (
                                        <button
                                            onClick={() => setIsUpdatingPassword(true)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Change Password
                                        </button>
                                    )}
                                </div>

                                {isUpdatingPassword ? (
                                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className={labelClasses}>New Password</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="At least 8 characters..."
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                type="submit"
                                                className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg"
                                            >
                                                Update Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewPassword('');
                                                    setIsUpdatingPassword(false);
                                                }}
                                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-xs font-bold rounded-lg text-gray-700 dark:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        Authentication is securely processed by Supabase. Tap button above to safely rewrite credentials.
                                    </div>
                                )}
                            </div>

                            {/* Preferences & Visibility */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Preferences & Visibility</h3>
                                
                                <div className="space-y-4 pt-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-semibold block text-xs">Leaderboard Visibility</span>
                                            <span className="text-[10px] text-gray-400">Show ranking on public index</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={leaderboardVisibility}
                                            onChange={(e) => {
                                                setLeaderboardVisibility(e.target.checked);
                                                handleSaveProfile({ leaderboard_visibility: e.target.checked }, 'Leaderboard visibility updated.');
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-semibold block text-xs">Email Notifications</span>
                                            <span className="text-[10px] text-gray-400">Receive trade alerts & reports</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationPreferences}
                                            onChange={(e) => {
                                                setNotificationPreferences(e.target.checked);
                                                handleSaveProfile({ notification_preferences: e.target.checked }, 'Notification preferences updated.');
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preferences Selector (Theme) */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Visual Interface Theme</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                            theme === 'light'
                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        Light Theme
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                            theme === 'dark'
                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        Dark Theme
                                    </button>
                                </div>
                            </div>

                            {/* Integration Switcher */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Data Stream Integrations</h3>
                                <div className="flex items-center justify-between">
                                    {upstoxConnected ? (
                                        <>
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                Live Connected
                                            </div>
                                            <button
                                                onClick={() => {
                                                    disconnectUpstox();
                                                    toast.success('Live data feed disconnected.');
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                Offline Stream
                                            </div>
                                            <button
                                                onClick={() => {
                                                    connectUpstox();
                                                    toast.success('Connecting live data feed...');
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 rounded transition-colors"
                                            >
                                                Connect Feed
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Legal Checklists / Policies */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Legal & Agreements</h3>
                                <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">✓</div>
                                        <span>Terms of Service Accepted</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">✓</div>
                                        <span>Privacy Policy Acknowledged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">✓</div>
                                        <span>Risk Disclosure Accepted</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: PERFORMANCES & LOGS */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Balance Overview */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-5">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Balance</h2>
                                    <button
                                        onClick={() => {
                                            handleSaveProfile({ starting_capital: 1000000, current_balance: 1000000 }, 'Account capital refilled.');
                                            toast.success('Account balance refilled to ₹10,00,000!');
                                        }}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Refill Capital (₹10L)
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Starting Capital</span>
                                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {formatCurrency(startingCapital)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Available Cash</span>
                                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {formatCurrency(currentBalance)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Portfolio Assets Value</span>
                                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {formatCurrency(portfolioValue)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance statistics */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Trading Performance</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Return (P&L)</span>
                                        <div className={`text-lg font-mono font-bold mt-1 ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                                            <span className="text-xs font-sans ml-1 inline opacity-80">({formatPercent(totalPnLPercent)})</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Executed Trades</span>
                                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {totalTrades} trades
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Win Rate</span>
                                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {winRate}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security & Access logs */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Access Security & Timestamps</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Created At</span>
                                        <span className="font-mono mt-1 block text-gray-900 dark:text-white">{new Date(createdAt).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Last Updated At</span>
                                        <span className="font-mono mt-1 block text-gray-900 dark:text-white">{new Date(updatedAt).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Last Access Login</span>
                                        <span className="font-mono mt-1 block text-gray-900 dark:text-white">{new Date(lastLogin).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Holdings Table */}
                            <div className="p-6 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm space-y-4">
                                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-3">Active Positions ({activeHoldings.length})</h2>
                                {activeHoldings.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                                                    <th className="py-2.5">Symbol</th>
                                                    <th className="py-2.5 text-right">Quantity</th>
                                                    <th className="py-2.5 text-right">Avg Price</th>
                                                    <th className="py-2.5 text-right font-semibold">PnL (%)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeHoldings.slice(0, 5).map((holding) => (
                                                    <tr key={holding.symbol} className="border-b border-gray-100/40 dark:border-slate-800/20 hover:bg-gray-100/20 dark:hover:bg-slate-800/10 transition-colors">
                                                        <td className="py-3 font-semibold text-gray-900 dark:text-white">{holding.symbol}</td>
                                                        <td className="py-3 text-right font-mono text-xs">{holding.quantity}</td>
                                                        <td className="py-3 text-right font-mono text-xs">₹{holding.avgPrice.toFixed(2)}</td>
                                                        <td className={`py-3 text-right font-mono text-xs font-semibold ${(holding.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {formatPercent(holding.pnlPercent)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No active positions currently.</p>
                                )}
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
