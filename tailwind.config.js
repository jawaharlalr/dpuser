/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#8B0000',      // Deep Red
          orange: '#FF4500',   // Flame Orange
          yellow: '#FFD700',   // Gold/Flame accent
          dark: '#1a0505',     // Very dark red/black background
          surface: '#2b0a0a',  // Slightly lighter dark for cards
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Ensure you import this in index.css
      }
    },
  },
  plugins: [],
}