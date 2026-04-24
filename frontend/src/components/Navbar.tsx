import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUpstoxStore } from '../stores/upstoxStore';
import { useThemeStore } from '../stores/themeStore';
import {
    LayoutDashboard,
    BookOpen,
    PieChart,
    Brain,
    List,
    Search,
    LogOut,
    X,
    Sun,
    Moon,
    BookMarked
} from 'lucide-react';

interface NavbarProps {
    showSearch?: boolean;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
    customSearch?: React.ReactNode;
}

export const Navbar = ({ showSearch = false, searchTerm = '', onSearchChange, customSearch }: NavbarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuthStore();
    const { isConnected: upstoxConnected, connect: connectUpstox, disconnect: disconnectUpstox } = useUpstoxStore();
    const { theme, toggleTheme } = useThemeStore();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
        <button
            onClick={() => navigate(path)}
            className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 transition-all duration-200 ${isActive(path)
                ? 'bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="w-full px-6 h-full">
                <div className="flex justify-between items-center h-full">

                    {/* Left: Brand & Nav */}
                    <div className="flex items-center gap-8">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/dashboard')}
                        >
                            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-primary/20 transform transition-transform group-hover:scale-105">
                                <img 
                                    src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                                    alt="SimVest Logo" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">SimVest</h1>
                        </div>

                        <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

                        <div className="hidden md:flex items-center gap-2">
                            <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem path="/practice" icon={BookOpen} label="Terminal" />
                            <NavItem path="/portfolio" icon={PieChart} label="Portfolio" />
                            <NavItem path="/orders" icon={List} label="Orders" />
                            <NavItem path="/journal" icon={BookMarked} label="Journal" />
                        </div>
                    </div>

                    {/* Right: Search & Actions */}
                    <div className="flex items-center gap-4">

                        {/* Advisor Button */}
                        <button
                            onClick={() => navigate('/advisor')}
                            className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all ${isActive('/advisor')
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            <span>Advisor</span>
                        </button>

                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

                        {/* Search */}
                        {/* Custom Search slot */}
                        {customSearch && (
                            <div className="hidden md:block">
                                {customSearch}
                            </div>
                        )}

                        {/* Default Search */}
                        {!customSearch && showSearch && onSearchChange && (
                            <div className="relative group hidden md:block w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full h-10 pl-10 pr-10 text-sm bg-gray-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-700 rounded-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    placeholder="Search markets..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Status Icons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-yellow-400" />}
                            </button>

                            {upstoxConnected ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={disconnectUpstox} title="Click to Disconnect">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Live</span>
                                </div>
                            ) : (
                                <button
                                    onClick={connectUpstox}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full hover:border-gray-300 dark:hover:border-slate-600 transition-colors group"
                                    title="Connect Data Feed"
                                >
                                    <div className="w-2 h-2 bg-gray-400 dark:bg-slate-600 rounded-full"></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 uppercase tracking-wide">Offline</span>
                                </button>
                            )}
                            {/* Logout Button */}
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Avatar */}
                        <div className="pl-2 border-l border-gray-200 dark:border-slate-700 ml-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow ring-2 ring-white dark:ring-slate-800 select-none cursor-default">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
