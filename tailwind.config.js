/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", 'sans-serif'],
        body:    ["'Inter'", 'sans-serif'],
      },
      colors: {
        purple: {
          DEFAULT: '#9333ea',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        indigo: {
          DEFAULT: '#6366f1',
        },
      },
    },
  },
  plugins: [],
};
