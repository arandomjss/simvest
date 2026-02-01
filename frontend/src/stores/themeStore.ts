import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: newTheme });
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            },
            setTheme: (theme) => {
                set({ theme });
                document.documentElement.classList.toggle('dark', theme === 'dark');
            },
        }),
        {
            name: 'simvest-theme',
        }
    )
);