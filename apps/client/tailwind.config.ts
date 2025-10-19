import { type Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a0a0a',
        },
        secondary: {
          DEFAULT: '#fb923c',
        },
      },
    },
  },
  plugins: [],
} as Config
