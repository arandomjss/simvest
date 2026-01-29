import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, error, isLoading, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    const handleQuickStart = () => {
        useAuthStore.setState({
            user: { id: 'dev-user-123', email: 'dev@simvest.com' },
            isAuthenticated: true,
            isLoading: false,
            error: null
        });
        localStorage.setItem('supabase.auth.token', 'mock-token-dev');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-4">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">SimVest</h1>
                        <p className="text-text-secondary">Professional Paper Trading Platform</p>
                    </div>

                    {/* Quick Start Button */}
                    <button
                        onClick={handleQuickStart}
                        className="w-full mb-6 bg-gradient-to-r from-success to-success-dark text-white font-semibold py-3 px-4 rounded shadow-md hover:shadow-lg transition duration-200"
                    >
                        🚀 Quick Start (Skip Login)
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface text-text-secondary">Or login with credentials</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field w-full"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field w-full"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-danger/10 border border-danger/30 rounded p-3">
                                <p className="text-danger text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-2.5"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
