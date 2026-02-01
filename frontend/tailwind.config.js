/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode (we will force 'dark' in index.css)
    theme: {
        extend: {
            colors: {
                // Professional Light Theme
                primary: {
                    DEFAULT: '#2563EB', // Royal Blue
                    dark: '#1D4ED8',
                    light: '#60A5FA',
                },
                secondary: {
                    DEFAULT: '#059669', // Emerald
                },
                background: {
                    DEFAULT: '#F9FAFB', // Gray-50 (App Background)
                    light: '#FFFFFF', // White
                },
                surface: {
                    DEFAULT: '#FFFFFF', // Card background
                    hover: '#F3F4F6', // Gray-100
                    border: '#E5E7EB', // Gray-200
                },
                success: {
                    DEFAULT: '#059669', // Emerald-600
                    glow: 'rgba(5, 150, 105, 0.2)',
                },
                danger: {
                    DEFAULT: '#DC2626', // Red-600
                    glow: 'rgba(220, 38, 38, 0.2)',
                },
                text: {
                    primary: '#111827', // Gray-900
                    secondary: '#4B5563', // Gray-600
                    muted: '#9CA3AF', // Gray-400
                },
                border: {
                    DEFAULT: '#E5E7EB', // Gray-200
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'neon': '0 0 5px rgba(37, 99, 235, 0.2)', // Subtle blue glow
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                // Subtle light gradient
                'hero-glow': 'linear-gradient(to right bottom, #ebf4ff, #f3f4f6)',
            },
            keyframes: {
                'progress-grow': {
                    '0%': { width: '0%' },
                    '100%': { width: '100%' }, // Allows it to animate to the inline-style width? Actually this overrides it.
                    // Better approach: width from 0 to var(--target-width) is hard in pure CSS without custom props.
                    // Instead, simple fade-in or scale-x
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
    },
    plugins: [],
}
