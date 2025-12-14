/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'studio': {
          900: '#0d0d0d',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#4a4a4a',
        },
        'accent': {
          primary: '#00d4aa',
          secondary: '#ff6b6b',
          tertiary: '#4ecdc4',
        }
      }
    },
  },
  plugins: [],
}
