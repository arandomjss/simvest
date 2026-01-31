import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUpstoxStore } from '../stores/upstoxStore';

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

    return (
        <nav className="bg-surface border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    {/* Logo and Nav */}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-xl font-bold text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>
                            SimVest
                        </h1>
                        <div className="hidden md:flex space-x-1">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/dashboard')
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/practice')}
                                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/practice')
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                Practice
                            </button>
                            <button
                                onClick={() => navigate('/portfolio')}
                                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/portfolio')
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                Portfolio
                            </button>
                            <button
                                onClick={() => navigate('/advisor')}
                                className={`px-4 py-2 text-sm font-medium rounded transition flex items-center space-x-1 ${isActive('/advisor')
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                <span>🧠</span>
                                <span>Advisor</span>
                            </button>
                            <button
                                onClick={() => navigate('/orders')}
                                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/orders')
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }`}
                            >
                                Orders
                            </button>
                        </div>
                    </div>

                    {/* Global Search Bar (Optional) */}
                    {showSearch && onSearchChange && (
                        <div className="flex-1 max-w-lg px-8 hidden md:block">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-text-secondary group-focus-within:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background-light placeholder-text-secondary focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="Search stocks, companies..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User Section */}
                    <div className="flex items-center space-x-3">
                        {/* Upstox Connection Status */}
                        {upstoxConnected ? (
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 px-3 py-1.5 bg-profit/10 rounded">
                                    <div className="w-2 h-2 bg-profit rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-profit">Live Data Active</span>
                                </div>
                                <button
                                    onClick={disconnectUpstox}
                                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-loss hover:bg-loss/5 rounded transition"
                                    title="Disconnect from Upstox"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={connectUpstox}
                                className="px-4 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition flex items-center space-x-2"
                                title="Connect to Upstox for live market data (Admin only)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Enable Live Data</span>
                            </button>
                        )}

                        <span className="text-sm text-text-secondary hidden sm:inline">{user?.email}</span>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger/5 rounded transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
