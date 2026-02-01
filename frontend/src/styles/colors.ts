// Single Source of Truth for Colors
// Used by: tailwind.config.js AND React Components (Charts)

export const colors = {
    primary: {
        DEFAULT: '#2563EB',
        dark: '#1D4ED8',
        light: '#60A5FA',
    },
    success: {
        DEFAULT: '#059669',
        dark: '#047857',
        light: '#10B981',
    },
    danger: {
        DEFAULT: '#DC2626',
        dark: '#B91C1C',
        light: '#EF4444',
    },
    // Light theme colors
    background: {
        DEFAULT: '#F9FAFB',
        dark: '#F5F5F5',
    },
    surface: {
        DEFAULT: '#FFFFFF',
        hover: '#F3F4F6',
    },
    text: {
        primary: '#111827',
        secondary: '#4B5563',
        muted: '#9CA3AF',
    },
    border: {
        DEFAULT: '#E5E7EB',
        light: '#F3F4F6',
    },
    // Dark theme colors
    dark: {
        background: {
            DEFAULT: '#0F172A',
            light: '#1E293B',
        },
        surface: {
            DEFAULT: '#1E293B',
            hover: '#334155',
        },
        text: {
            primary: '#F8FAFC',
            secondary: '#CBD5E1',
            muted: '#64748B',
        },
        border: {
            DEFAULT: '#475569',
            light: '#64748B',
        }
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

// Theme-aware color getter function
export const getThemeColors = (isDark: boolean) => {
    return {
        primary: colors.primary.DEFAULT,
        success: colors.success.DEFAULT,
        danger: colors.danger.DEFAULT,
        background: isDark ? colors.dark.background.DEFAULT : colors.background.DEFAULT,
        surface: isDark ? colors.dark.surface.DEFAULT : colors.surface.DEFAULT,
        text: isDark ? colors.dark.text.primary : colors.text.primary,
        textSecondary: isDark ? colors.dark.text.secondary : colors.text.secondary,
        textMuted: isDark ? colors.dark.text.muted : colors.text.muted,
        border: isDark ? colors.dark.border.DEFAULT : colors.border.DEFAULT,
    };
};

export const darkThemeColors = {
    background: '#0F172A', // Slightly darker background for better contrast
    textPrimary: '#F8FAFC', // Brighter primary text
    textSecondary: '#CBD5E1', // Adjusted secondary text for better readability
    textMuted: '#94A3B8', // Slightly brighter muted text
    border: '#475569',
};

export const lightThemeColors = {
    background: '#F9FAFB',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    border: '#E5E7EB',
};
