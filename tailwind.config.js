/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d1315',
        secondary: '#1a2025',
        gold: '#d4a541',
        'gold-light': '#e8c96a',
        'gold-dark': '#b88c2e',
      }
    },
  },
  plugins: [],
}