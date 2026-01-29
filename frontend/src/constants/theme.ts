// Theme constants for SimVest - Zerodha Kite inspired
// Use these constants throughout the application for consistency

export const COLORS = {
    // Primary colors
    primary: '#387ed1',
    primaryDark: '#2e6bb3',
    primaryLight: '#5a9ae0',

    // Success/Buy colors
    success: '#00c48c',
    successDark: '#00a876',
    successLight: '#33d0a3',

    // Danger/Sell colors
    danger: '#ff5b5b',
    dangerDark: '#e64545',
    dangerLight: '#ff7b7b',

    // Background colors
    background: '#fafafa',
    backgroundDark: '#f5f5f5',

    // Surface colors
    surface: '#ffffff',
    surfaceHover: '#f8f9fa',

    // Text colors
    textPrimary: '#424242',
    textSecondary: '#666666',
    textMuted: '#999999',

    // Border colors
    border: '#dddddd',
    borderLight: '#eeeeee',
} as const;

export const THEME = {
    // Spacing
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },

    // Border radius
    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
    },

    // Shadows
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },

    // Typography
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
    },
} as const;

// CSS class utilities for consistent styling
export const BUTTON_CLASSES = {
    primary: 'px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-dark transition-all duration-200',
    success: 'px-4 py-2 bg-success text-white font-medium rounded hover:bg-success-dark transition-all duration-200',
    danger: 'px-4 py-2 bg-danger text-white font-medium rounded hover:bg-danger-dark transition-all duration-200',
    secondary: 'px-4 py-2 bg-background text-text-primary font-medium rounded hover:bg-background-dark transition-all duration-200',
} as const;

export const CARD_CLASSES = 'bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200';

export const INPUT_CLASSES = 'bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

export const TABLE_ROW_CLASSES = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
