/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#1a1b2e',
          card: '#242538',
          text: '#ffffff',
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          text: '#1a1b2e',
        },
      },
    },
  },
  plugins: [],
};