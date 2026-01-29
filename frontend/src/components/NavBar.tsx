// Shared Navigation Component for consistency across all pages
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface NavBarProps {
    activePage: 'dashboard' | 'portfolio' | 'orders';
}

export const NavBar = ({ activePage }: NavBarProps) => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { id: 'portfolio', label: 'Portfolio', path: '/portfolio' },
        { id: 'orders', label: 'Orders', path: '/orders' },
    ];

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
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={`px-4 py-2 text-sm font-medium rounded transition ${activePage === item.id
                                            ? 'text-primary bg-primary/5'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-text-secondary">{user?.email}</span>
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
