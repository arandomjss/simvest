import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UpstoxState {
    isConnected: boolean;
    isLoading: boolean;
    accessToken: string | null;
    error: string | null;

    connect: () => Promise<void>;
    handleCallback: (code: string) => Promise<void>;
    disconnect: () => Promise<void>;
    checkStatus: () => Promise<void>;
    clearError: () => void;
}

export const useUpstoxStore = create<UpstoxState>((set) => ({
    isConnected: false,
    isLoading: false,
    accessToken: null,
    error: null,

    connect: async () => {
        try {
            set({ isLoading: true, error: null });

            // Get login URL from backend
            const response = await axios.get(`${API_URL}/api/upstox/login-url`);

            if (response.data.success) {
                // Store state for verification
                localStorage.setItem('upstox_state', response.data.state);

                // Redirect to Upstox login
                window.location.href = response.data.loginUrl;
            } else {
                throw new Error('Failed to get login URL');
            }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to connect to Upstox',
                isLoading: false,
            });
            throw error;
        }
    },

    handleCallback: async (code: string) => {
        try {
            set({ isLoading: true, error: null });

            // Exchange code for access token
            const response = await axios.post(`${API_URL}/api/upstox/callback`, { code });

            if (response.data.success) {
                const accessToken = response.data.accessToken;

                // Store token
                localStorage.setItem('upstox_access_token', accessToken);

                set({
                    isConnected: true,
                    accessToken,
                    isLoading: false,
                });
            } else {
                throw new Error('Failed to exchange code for token');
            }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to authenticate with Upstox',
                isLoading: false,
                isConnected: false,
            });
            throw error;
        }
    },

    disconnect: async () => {
        try {
            await axios.post(`${API_URL}/api/upstox/disconnect`);

            // Clear local storage
            localStorage.removeItem('upstox_access_token');
            localStorage.removeItem('upstox_state');

            set({
                isConnected: false,
                accessToken: null,
                error: null,
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to disconnect from Upstox' });
            throw error;
        }
    },

    checkStatus: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/upstox/status`);

            if (response.data.success) {
                const isConnected = response.data.isConnected;
                const accessToken = localStorage.getItem('upstox_access_token');

                set({
                    isConnected,
                    accessToken: isConnected ? accessToken : null,
                });
            }
        } catch (error: any) {
            console.error('Failed to check Upstox status:', error);
            set({ isConnected: false, accessToken: null });
        }
    },

    clearError: () => set({ error: null }),
}));
