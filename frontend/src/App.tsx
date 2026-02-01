import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuthStore } from './stores/authStore';
import { UpstoxCallbackPage } from './pages/UpstoxCallbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PracticePage } from './pages/PracticePage';

import { AdvisorPage } from './pages/AdvisorPage';
import { OrdersPage } from './pages/OrdersPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const App = () => {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/callback" element={<UpstoxCallbackPage />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/practice" element={<PracticePage />} />
                        <Route path="/advisor" element={<AdvisorPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
};

export default App;
