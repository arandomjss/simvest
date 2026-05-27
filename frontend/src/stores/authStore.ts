import { create } from 'zustand';
import { authService } from '../services/supabase';
import type { User } from '../types';

// ─── Security Helper ──────────────────────────────────────────────────────────
// Supabase returns raw internal error strings that can enable user enumeration.
// For example "User already registered" confirms an email exists in the system.
// This function maps all such messages to a safe generic equivalent.
function sanitizeAuthError(message: string): string {
    const m = (message || '').toLowerCase();
    if (m.includes('invalid login credentials') || m.includes('invalid password') || m.includes('wrong password')) {
        return 'Invalid email or password.';
    }
    if (m.includes('user already registered') || m.includes('already been registered')) {
        // Don't confirm whether an email is registered — return same message as wrong password
        return 'Invalid email or password.';
    }
    if (m.includes('email not confirmed') || m.includes('email link is invalid or has expired')) {
        return 'Please confirm your email address before signing in.';
    }
    if (m.includes('too many requests') || m.includes('rate limit')) {
        return 'Too many login attempts. Please wait a few minutes and try again.';
    }
    if (m.includes('password') && m.includes('characters')) {
        return 'Password must be at least 8 characters.';
    }
    if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) {
        return 'Connection error. Please check your internet and try again.';
    }
    // Default: don't expose the raw message
    return 'An error occurred. Please try again.';
}


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
    updateProfile: (data: Record<string, any>) => Promise<void>;
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
            // Supabase SDK persists the session automatically — no manual localStorage write needed.
            set({
                // Include user_metadata so onboarding_completed and profile fields are accessible
                user: user ? { id: user.id, email: user.email!, ...(user.user_metadata || {}) } as any : null,
                isAuthenticated: !!user && !!session,
                isLoading: false,
            });
        } catch (error: any) {
            // Sanitize Supabase error messages to prevent user enumeration.
            // e.g. "Invalid login credentials" is safe; raw internal errors are not.
            const safeMessage = sanitizeAuthError(error.message);
            set({ error: safeMessage, isLoading: false });
            throw new Error(safeMessage);
        }
    },

    signUp: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            await authService.signUp(email, password);
            // Never set isAuthenticated=true here. Email confirmation is required.
            // The user must verify their email and sign in separately.
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
            const safeMessage = sanitizeAuthError(error.message);
            set({ error: safeMessage, isLoading: false });
            throw new Error(safeMessage);
        }
    },

    signOut: async () => {
        // Clear local state instantly and synchronously so UI responds without network delay
        set({ user: null, isAuthenticated: false, error: null });
        localStorage.removeItem('supabase.auth.token'); // Clear legacy key if still set

        // Perform Supabase sign out in the background
        await authService.signOut().catch(() => {});
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            // Supabase SDK handles token persistence and auto-refresh natively.
            // We just ask for the current session — no manual localStorage reads.
            const session = await authService.getSession();

            if (session?.user && session?.access_token) {
                set({
                    // Include user_metadata so onboarding_completed and profile fields are accessible
                    user: {
                        id: session.user.id,
                        email: session.user.email!,
                        ...(session.user.user_metadata || {})
                    } as any,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch {
            // Network failure — treat as unauthenticated, don't surface error message
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),

    updateProfile: async (data: Record<string, any>) => {
        const { error } = await import('../services/supabase').then(m => m.supabase.auth.updateUser({ data }));
        if (error) throw error;
    },
}));
