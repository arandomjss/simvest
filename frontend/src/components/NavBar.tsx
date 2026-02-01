import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUpstoxStore } from '../stores/upstoxStore';
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

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
        <button
            onClick={() => navigate(path)}
            className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 transition-all ${isActive(path)
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="h-16 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all">
            <div className="w-full px-6 h-full">
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
                            <h1 className="text-xl font-extrabold text-text-primary tracking-tight group-hover:text-primary transition-colors">SimVest</h1>
                        </div>

                        <div className="h-8 w-px bg-border/50 hidden md:block"></div>

                        <div className="hidden md:flex items-center gap-2">
                            <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem path="/practice" icon={BookOpen} label="Terminal" />
                            <NavItem path="/portfolio" icon={PieChart} label="Portfolio" />
                            <NavItem path="/orders" icon={List} label="Orders" />
                            <button
                                onClick={() => navigate('/advisor')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all ${isActive('/advisor')
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full h-10 pl-10 pr-10 text-sm bg-surface-hover/50 border border-transparent focus:bg-background rounded-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/70 shadow-sm"
                                    placeholder="Search markets..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="h-6 w-px bg-border hidden md:block"></div>

                        {/* Connection Status */}
                        {upstoxConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full cursor-pointer hover:bg-green-500/20 transition-colors" onClick={disconnectUpstox} title="Click to Disconnect">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Live</span>
                            </div>
                        ) : (
                            <button
                                onClick={connectUpstox}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full hover:border-gray-300 transition-colors group"
                                title="Connect Data Feed"
                            >
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 uppercase tracking-wide">Offline</span>
                            </button>
                        )}

                        {/* User Profile (Minimal) */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white cursor-pointer hover:ring-primary/20 transition-all">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-text-muted hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
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
