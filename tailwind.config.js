import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0F172A',
          accent: '#06B6D4',
        },
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.3)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        pop: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '40%': { transform: 'scale(1.05)', filter: 'brightness(1.15)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
      },
      animation: {
        blink: 'blink 1.4s ease-in-out infinite',
        pop: 'pop 600ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
}

export default config
