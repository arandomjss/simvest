import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useMarketStore } from './stores/marketStore';
import { UpstoxCallbackPage } from './pages/UpstoxCallbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PracticePage } from './pages/PracticePage';
import { AdvisorPage } from './pages/AdvisorPage';
import { OrdersPage } from './pages/OrdersPage';
import { JournalPage } from './pages/JournalPage';
import { DemoPage } from './pages/DemoPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicRoute } from './components/PublicRoute';
import { Toaster } from 'react-hot-toast';

const App = () => {
    const { checkAuth } = useAuthStore();
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const { connectWebSocket, disconnectWebSocket } = useMarketStore();

    useEffect(() => {
        connectWebSocket();
        return () => disconnectWebSocket();
    }, [connectWebSocket, disconnectWebSocket]);

    useEffect(() => {
        // Initialize theme on app start
        const savedTheme = localStorage.getItem('simvest-theme');
        if (savedTheme) {
            const themeData = JSON.parse(savedTheme);
            setTheme(themeData.state.theme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }
    }, [setTheme]);

    useEffect(() => {
        // Update document class when theme changes
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return (
        <ErrorBoundary>
            <Toaster position="bottom-right" toastOptions={{ duration: 4000, style: { background: theme === 'dark' ? '#1e293b' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' } }} />
            <BrowserRouter>
                <Routes>
                    {/* Public-only Routes */}
                    <Route element={<PublicRoute />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Route>
                    <Route path="/callback" element={<UpstoxCallbackPage />} />
                    <Route path="/demo" element={<DemoPage />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/journal" element={<JournalPage />} />
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
