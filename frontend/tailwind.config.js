/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#635bff',
          700: '#5046e4',
          800: '#3c2fc2',
          900: '#2e239b',
        },
        stripe: {
          purple: '#635bff',
          cyan: '#00d4ff',
          green: '#00d924',
          pink: '#ff5caa',
          orange: '#ff8a00',
        },
      },
    },
  },
  plugins: [],
}
