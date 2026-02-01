/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // Light & Dark Theme Support
                primary: {
                    DEFAULT: '#2563EB', // Royal Blue
                    dark: '#1D4ED8',
                    light: '#60A5FA',
                },
                secondary: {
                    DEFAULT: '#059669', // Emerald
                },
                background: {
                    DEFAULT: '#F9FAFB', // Light mode app background
                    light: '#FFFFFF', // White
                },
                surface: {
                    DEFAULT: '#FFFFFF', // Light mode card background
                    hover: '#F3F4F6', // Light mode hover
                    border: '#E5E7EB', // Light mode border
                },
                success: {
                    DEFAULT: '#059669', // Emerald-600
                    glow: 'rgba(5, 150, 105, 0.2)',
                },
                danger: {
                    DEFAULT: '#DC2626', // Red-600
                    glow: 'rgba(220, 38, 38, 0.2)',
                },
                profit: {
                    DEFAULT: '#059669', // Green for profits
                    light: '#10B981',
                    dark: '#047857',
                },
                loss: {
                    DEFAULT: '#DC2626', // Red for losses
                    light: '#EF4444',
                    dark: '#B91C1C',
                },
                text: {
                    primary: '#111827', // Light mode primary text
                    secondary: '#4B5563', // Light mode secondary text
                    muted: '#9CA3AF', // Light mode muted text
                },
                border: {
                    DEFAULT: '#E5E7EB', // Light mode border
                },
                // Dark mode colors
                dark: {
                    background: {
                        DEFAULT: '#0F172A', // Dark mode app background (slate-900)
                        light: '#1E293B', // Dark mode card background (slate-800)
                        hover: '#334155', // Dark mode hover (slate-700)
                    },
                    surface: {
                        DEFAULT: '#1E293B', // Dark mode card background
                        hover: '#334155', // Dark mode hover
                        border: '#475569', // Dark mode border (slate-600)
                    },
                    text: {
                        primary: '#F8FAFC', // Dark mode primary text (slate-50)
                        secondary: '#CBD5E1', // Dark mode secondary text (slate-300)
                        muted: '#64748B', // Dark mode muted text (slate-500)
                    },
                    border: {
                        DEFAULT: '#475569', // Dark mode border (slate-600)
                        light: '#64748B', // Dark mode light border (slate-500)
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glass-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                'neon': '0 0 5px rgba(37, 99, 235, 0.2)',
                'neon-dark': '0 0 5px rgba(37, 99, 235, 0.4)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'linear-gradient(to right bottom, #ebf4ff, #f3f4f6)',
                'hero-glow-dark': 'linear-gradient(to right bottom, #1e293b, #0f172a)',
            },
            keyframes: {
                'progress-grow': {
                    '0%': { width: '0%' },
                    '100%': { width: '100%' },
                },
                'scale-in': {
                    '0%': { transform: 'scaleX(0)' },
                    '100%': { transform: 'scaleX(1)' }
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                }
            },
            animation: {
                'scale-in': 'scale-in 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
            }
        },
    },
    plugins: [],
}
