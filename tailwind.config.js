/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#1E5EFF',
        accent: '#FF6B35',
        success: '#00875A',
        warning: '#C77700',
        danger: '#DA1E28',
        'surface-base': '#FFFFFF',
        'surface-raised': '#F7F8FA',
        'text-primary': '#0A0A0A',
        'text-secondary': '#595959',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '16px',
      },
    },
  },
  plugins: [],
}
