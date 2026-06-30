import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#f6f5f4',
        },
        ink: {
          DEFAULT: '#000000',
          secondary: '#31302e',
          muted: '#615d59',
          faint: '#a39e98',
        },
        hairline: '#e6e6e6',
        notion: {
          blue: '#0075de',
          'blue-dark': '#005bab',
          indigo: '#213183',
        },
        fit: {
          high: '#1aae39',
          medium: '#dd5b00',
          low: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '5px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.03em',
      },
    },
  },
  plugins: [],
}

export default config
