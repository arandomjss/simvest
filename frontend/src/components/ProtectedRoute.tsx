import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            checkAuth();
        }
    }, [isAuthenticated, isLoading, checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                    <img src="/logo-light.png" alt="SimVest" className="w-full h-full object-cover" />
                </div>
                <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">SimVest</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Pass the attempted URL so login can redirect back after sign-in
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
