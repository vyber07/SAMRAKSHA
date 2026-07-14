/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          50: '#e7f1ff',
          100: '#cfe3ff',
          500: '#0d6efd',
          600: '#0b5ed7',
          700: '#0a58ca',
        },
        // Semantic colors
        success: '#198754',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0',
        // Neutral scale
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        sm: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        base: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        lg: ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        xl: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        '2xl': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        '3xl': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        '4xl': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
