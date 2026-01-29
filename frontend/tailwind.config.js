/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Zerodha Kite-inspired color palette
                primary: {
                    DEFAULT: '#387ed1',
                    dark: '#2e6bb3',
                    light: '#5a9ae0',
                },
                success: {
                    DEFAULT: '#00c48c',
                    dark: '#00a876',
                    light: '#33d0a3',
                },
                danger: {
                    DEFAULT: '#ff5b5b',
                    dark: '#e64545',
                    light: '#ff7b7b',
                },
                background: {
                    DEFAULT: '#fafafa',
                    dark: '#f5f5f5',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    hover: '#f8f9fa',
                },
                text: {
                    primary: '#424242',
                    secondary: '#666666',
                    muted: '#999999',
                },
                border: {
                    DEFAULT: '#dddddd',
                    light: '#eeeeee',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
