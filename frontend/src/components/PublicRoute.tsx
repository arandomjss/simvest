import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface PublicRouteProps {
    children?: React.ReactNode;
}

/**
 * PublicRoute prevents authenticated users from accessing pages like Login and Register.
 * If a user is authenticated:
 *   - onboarded → redirect to /dashboard
 *   - not yet onboarded → redirect to /onboarding
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuthStore();

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
        const onboardingDone = (user as any)?.onboarding_completed === true;
        return <Navigate to={onboardingDone ? '/dashboard' : '/onboarding'} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
