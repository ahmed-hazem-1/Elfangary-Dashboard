/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './components/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#D97706', // Amber-600 (Honey Gold - Primary Action)
          tealDark: '#B45309', // Amber-700
          orange: '#F59E0B', // Amber-500 (Secondary)
          orangeLight: '#FEF3C7', // Amber-100
          bg: '#FFFBEB', // Amber-50 (Warm background)
        }
      }
    }
  },
  plugins: [],
}
