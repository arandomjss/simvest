/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Terminal-style dark theme
                dark: {
                    bg: '#0a0a0a',
                    surface: '#121212',
                    elevated: '#1a1a1a',
                    border: '#2a2a2a',
                    text: {
                        primary: '#e0e0e0',
                        secondary: '#a0a0a0',
                        muted: '#707070'
                    }
                },
                accent: {
                    green: '#00ff41',
                    red: '#ff0040',
                    blue: '#00d4ff',
                    yellow: '#ffd700',
                    purple: '#b026ff'
                },
                trading: {
                    buy: '#00ff41',
                    sell: '#ff0040',
                    profit: '#00ff41',
                    loss: '#ff0040'
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif']
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 255, 65, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 255, 65, 0.8)' }
                }
            }
        },
    },
    plugins: [],
}
