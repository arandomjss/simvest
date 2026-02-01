// Single Source of Truth for Colors
// Used by: tailwind.config.js AND React Components (Charts)

export const colors = {
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
    }
};

// Flattened version for simple imports if needed
export const palette = {
    primary: colors.primary.DEFAULT,
    success: colors.success.DEFAULT,
    danger: colors.danger.DEFAULT,
    background: colors.background.DEFAULT,
    surface: colors.surface.DEFAULT,
    text: colors.text.primary,
};
