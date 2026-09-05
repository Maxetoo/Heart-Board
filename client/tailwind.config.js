/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FE6349',
          dark: '#e05234',
        },
        ink: '#1A1B25',
        muted: '#666D80',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      boxShadow: {
        // Tailwind v4 name used throughout the AI Studio export; v3 has no `shadow-xs`.
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
