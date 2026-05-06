import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/auth': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    },
    // ── PRODUCTION HARDENING ──────────────────────────────────────────────────
    // Strip all console calls and debugger statements at build time.
    // This prevents architecture leakage in users' DevTools (e.g. subscription
    // counts, mock mode flags, error details) without touching source files.
    esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
}))
