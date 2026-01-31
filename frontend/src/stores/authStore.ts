import { create } from 'zustand';
import { authService } from '../services/supabase';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,

    signIn: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const { user, session } = await authService.signIn(email, password);

            if (session?.access_token) {
                localStorage.setItem('supabase.auth.token', session.access_token);
            }

            set({
                user: user ? { id: user.id, email: user.email! } : null,
                isAuthenticated: !!user,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to sign in',
                isLoading: false,
            });
            throw error;
        }
    },

    signUp: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const { user } = await authService.signUp(email, password);

            set({
                user: user ? { id: user.id, email: user.email! } : null,
                isAuthenticated: false, // Email confirmation required
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to sign up',
                isLoading: false,
            });
            throw error;
        }
    },

    signOut: async () => {
        try {
            await authService.signOut();
            localStorage.removeItem('supabase.auth.token');
            set({
                user: null,
                isAuthenticated: false,
                error: null,
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to sign out' });
            throw error;
        }
    },

    checkAuth: async () => {
        try {
            set({ isLoading: true });

            // Check for mock token (Quick Start)
            const mockToken = localStorage.getItem('supabase.auth.token');
            if (mockToken === 'mock-token-dev') {
                set({
                    user: { id: 'dev-user-123', email: 'dev@simvest.com' },
                    isAuthenticated: true,
                    isLoading: false,
                });
                return;
            }

            // Check for real Supabase session with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth check timeout')), 3000)
            );

            const sessionPromise = authService.getSession();
            const session = await Promise.race([sessionPromise, timeoutPromise]) as any;

            if (session?.access_token) {
                localStorage.setItem('supabase.auth.token', session.access_token);
                const user = session.user;
                set({
                    user: user ? { id: user.id, email: user.email! } : null,
                    isAuthenticated: !!user,
                    isLoading: false,
                });
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.warn('Auth check failed, user not authenticated:', error);
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    clearError: () => set({ error: null }),
}));
