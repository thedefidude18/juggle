/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#000000',
          card: '#242538',
          text: '#ffffff',
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          text: '#000000',
        },
      },
    },
  },
  plugins: [],
};