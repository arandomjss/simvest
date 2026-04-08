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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-text-primary text-xl">Loading...</div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
