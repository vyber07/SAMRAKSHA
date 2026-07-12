/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/stitch_assets/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0B66D2",
        "primary-container": "#0b66d2",
        "on-primary-container": "#e3eaff",
        "surface-variant": "#2d3449",
        "on-surface-variant": "#c2c6d5",
        "text-secondary": "#94a3b8",
        "on-surface": "#ffffff"
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "sm": "0.25rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
