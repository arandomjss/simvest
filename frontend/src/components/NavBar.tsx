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
    Wifi,
    WifiOff,
    X
} from 'lucide-react';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
    showSearch?: boolean;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
}

export const Navbar = ({ showSearch = false, searchTerm = '', onSearchChange }: NavbarProps) => {
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
            className={`px-4 py-2 text-sm font-medium rounded flex items-center gap-2 transition-all ${isActive(path)
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="h-16 bg-gray-100 dark:bg-slate-900 border-b border-gray-300 dark:border-slate-700 shadow-sm flex-none z-40">
            <div className="max-w-7xl mx-auto px-4 h-full">
                <div className="flex justify-between items-center h-full">

                    {/* Left: Brand & Nav */}
                    <div className="flex items-center gap-8">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/dashboard')}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-white font-bold text-sm transform transition-transform group-hover:scale-105">
                                SV
                            </div>
                            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">SimVest</h1>
                        </div>

                        <div className="h-8 w-px bg-gray-300 dark:bg-slate-700 hidden md:block"></div>

                        <div className="hidden md:flex items-center gap-2">
                            <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem path="/practice" icon={BookOpen} label="Terminal" />
                            <NavItem path="/portfolio" icon={PieChart} label="Portfolio" />
                            <NavItem path="/orders" icon={List} label="Orders" />
                            <button
                                onClick={() => navigate('/advisor')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all ${isActive('/advisor')
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                <span>Advisor</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Search & Actions */}
                    <div className="flex items-center gap-6">

                        {/* Compact Search */}
                        {showSearch && onSearchChange && (
                            <div className="relative group hidden md:block w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full h-10 pl-10 pr-10 text-sm bg-gray-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-700 rounded-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm"
                                    placeholder="Search markets..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 hidden md:block"></div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-6 h-6 text-yellow-500" />
                            ) : (
                                <Moon className="w-6 h-6 text-yellow-400" />
                            )}
                        </button>

                        <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 hidden md:block"></div>

                        {/* Connection Status */}
                        {upstoxConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full cursor-pointer hover:bg-green-500/20 transition-colors" onClick={disconnectUpstox} title="Click to Disconnect">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Live</span>
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

                        {/* User Profile (Minimal) */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-slate-700 cursor-pointer hover:ring-primary/20 transition-all">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-800 rounded-full"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
