/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                canvas: 'var(--theme-canvas)',
                surface: 'var(--theme-surface)',
                'surface-raised': 'var(--theme-surface-raised)',
                'surface-soft': 'var(--theme-surface-soft)',
                input: 'var(--theme-input)',
                kbd: 'var(--theme-kbd)',
                ink: 'var(--theme-text)',
                secondary: 'var(--theme-text-secondary)',
                muted: 'var(--theme-text-muted)',
                subtle: 'var(--theme-text-subtle)',
                outline: 'var(--theme-border)',
                'outline-subtle': 'var(--theme-border-subtle)',
                accent: 'var(--theme-accent)',
                'accent-soft': 'var(--theme-accent-soft)',
                'accent-border': 'var(--theme-accent-border)',
                'accent-strong': 'var(--theme-accent-strong)',
                'avatar-ink': 'var(--theme-avatar-ink)',
                online: 'var(--theme-online)',
                primary: {
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                },
                neutral: {
                    50: 'var(--color-neutral-50)',
                    100: 'var(--color-neutral-100)',
                    200: 'var(--color-neutral-200)',
                    300: 'var(--color-neutral-300)',
                    400: 'var(--color-neutral-400)',
                    500: 'var(--color-neutral-500)',
                    600: 'var(--color-neutral-600)',
                    700: 'var(--color-neutral-700)',
                    800: 'var(--color-neutral-800)',
                    900: 'var(--color-neutral-900)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    light: 'var(--color-success-light)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    light: 'var(--color-warning-light)',
                },
                error: {
                    DEFAULT: 'var(--color-error)',
                    light: 'var(--color-error-light)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    light: 'var(--color-info-light)',
                },
            },

            fontFamily: {
                sans: ['Be Vietnam Pro', 'Segoe UI', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
                mono: ['Inter', 'sans-serif'],
            },

            fontSize: {
                xs: ['0.6875rem', { lineHeight: '1.4' }],
                sm: ['0.75rem', { lineHeight: '1.4' }],
                base: ['0.875rem', { lineHeight: '1.5' }],
                lg: ['1rem', { lineHeight: '1.5' }],
                xl: ['1.125rem', { lineHeight: '1.4' }],
                '2xl': ['1.25rem', { lineHeight: '1.35' }],
                '3xl': ['1.5rem', { lineHeight: '1.3' }],
                '4xl': ['1.875rem', { lineHeight: '1.2' }],
            },

            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            },

            boxShadow: {
                xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
                sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
                card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
            },

            borderRadius: {
                none: '0',
                sm: '0.25rem',
                DEFAULT: '0.375rem',
                md: '0.5rem',
                lg: '0.75rem',
                xl: '1rem',
                '2xl': '1.5rem',
                full: '9999px',
            },

            spacing: {
                18: '4.5rem',
                22: '5.5rem',
            },

            transitionDuration: {
                fast: '150ms',
                DEFAULT: '200ms',
                slow: '300ms',
            },

            transitionTimingFunction: {
                DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [],
};
