import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface PublicRouteProps {
    children?: React.ReactNode;
}

/**
 * PublicRoute prevents authenticated users from accessing pages like Login, Register, or Landing.
 * If a user is authenticated, it redirects them to the dashboard.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                {/* Logo */}
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                    <img src="/logo-light.png" alt="SimVest" className="w-full h-full object-cover" />
                </div>
                {/* Spinner */}
                <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                {/* Brand name */}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">SimVest</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
