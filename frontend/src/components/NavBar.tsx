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
            className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-colors ${isActive(path)
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="h-12 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600 shadow-sm flex-none z-40">
            <div className="max-w-7xl mx-auto px-4 h-full">
                <div className="flex justify-between items-center h-full">

                    {/* Left: Brand & Nav */}
                    <div className="flex items-center gap-6">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => navigate('/dashboard')}
                        >
                            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:bg-primary-dark transition-colors">
                                SV
                            </div>
                            <h1 className="text-lg font-bold text-text-primary tracking-tight">SimVest</h1>
                        </div>

                        <div className="h-6 w-px bg-border hidden md:block"></div>

                        <div className="hidden md:flex items-center gap-1">
                            <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem path="/practice" icon={BookOpen} label="Terminal" />
                            <NavItem path="/portfolio" icon={PieChart} label="Portfolio" />
                            <NavItem path="/orders" icon={List} label="Orders" />
                            <button
                                onClick={() => navigate('/advisor')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${isActive('/advisor')
                                    ? 'bg-purple-500/10 text-purple-600'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                <span>Advisor</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Search, Theme Toggle & Actions */}
                    <div className="flex items-center gap-4">

                        {/* Compact Search */}
                        {showSearch && onSearchChange && (
                            <div className="relative group hidden md:block w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full h-8 pl-8 pr-8 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/70"
                                    placeholder="Search (Cmd+K)"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="h-6 w-px bg-border hidden md:block"></div>

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

                        <div className="h-6 w-px bg-border hidden md:block"></div>

                        {/* Connection Status */}
                        {upstoxConnected ? (
                            <div className="flex items-center gap-2 px-2 py-1 bg-profit/5 border border-profit/20 rounded cursor-pointer hover:bg-profit/10 transition-colors" onClick={disconnectUpstox} title="Click to Disconnect">
                                <Wifi className="w-3.5 h-3.5 text-profit" />
                                <span className="text-[10px] font-bold text-profit uppercase tracking-wide">Live</span>
                            </div>
                        ) : (
                            <button
                                onClick={connectUpstox}
                                className="flex items-center gap-2 px-2 py-1 bg-surface-hover border border-border rounded hover:border-primary/50 transition-colors group"
                                title="Connect Data Feed"
                            >
                                <WifiOff className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-bold text-text-muted group-hover:text-primary uppercase tracking-wide">Offline</span>
                            </button>
                        )}

                        {/* User Profile (Minimal) */}
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-text-muted hover:text-danger transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
