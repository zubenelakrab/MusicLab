/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        'studio': {
          950: '#080808',
          900: '#0d0d0d',
          800: '#1a1a1a',
          750: '#222222',
          700: '#2a2a2a',
          650: '#323232',
          600: '#3a3a3a',
          500: '#4a4a4a',
          400: '#6a6a6a',
        },
        'accent': {
          primary: '#00d4aa',
          secondary: '#ff6b6b',
          tertiary: '#4ecdc4',
        }
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(0, 212, 170, 0.4), 0 0 30px rgba(0, 212, 170, 0.1)',
        'glow-secondary': '0 0 15px rgba(255, 107, 107, 0.4), 0 0 30px rgba(255, 107, 107, 0.1)',
        'glow-sm': '0 0 8px rgba(0, 212, 170, 0.3)',
        'panel': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #0d0d0d 0%, #080808 100%)',
        'gradient-panel': 'linear-gradient(180deg, #1a1a1a 0%, #151515 100%)',
        'gradient-header': 'linear-gradient(180deg, #2a2a2a 0%, #222222 100%)',
        'gradient-modal': 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.15s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 212, 170, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 212, 170, 0.6), 0 0 50px rgba(0, 212, 170, 0.2)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
