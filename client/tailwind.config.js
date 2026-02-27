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
          950: '#0f0f11', // Deepest background
          900: '#141417', // Main background
          800: '#1c1c21', // Panels
          750: '#25252b', // Light panels
          700: '#2e2e36', // Borders & dividers
          650: '#35353e', // Hover states
          600: '#3b3b45', // Secondary borders
          500: '#4f4f5a', // Muted text
          400: '#6b6b79', // Medium text
        },
        'accent': {
          primary: '#00e5a3', // Neon mint (play/active)
          secondary: '#ff5c5c', // Neon red (record/stop)
          tertiary: '#38bdf8', // Neon blue
        }
      },
      boxShadow: {
        'glow-primary': '0 0 12px rgba(0, 229, 163, 0.4), 0 0 24px rgba(0, 229, 163, 0.1)',
        'glow-secondary': '0 0 12px rgba(255, 92, 92, 0.4), 0 0 24px rgba(255, 92, 92, 0.1)',
        'glow-sm': '0 0 8px rgba(0, 229, 163, 0.3)',
        'panel': '0 10px 30px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'hardware-btn': 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
        'hardware-btn-pressed': 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
        'screen-inset': 'inset 0 2px 6px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #141417 0%, #0f0f11 100%)',
        'gradient-panel': 'linear-gradient(180deg, #1c1c21 0%, #17171b 100%)',
        'gradient-header': 'linear-gradient(180deg, #25252b 0%, #1c1c21 100%)',
        'gradient-modal': 'linear-gradient(180deg, #25252b 0%, #1c1c21 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.15s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 229, 163, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 229, 163, 0.5), 0 0 40px rgba(0, 229, 163, 0.2)' },
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
        'marquee': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
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
