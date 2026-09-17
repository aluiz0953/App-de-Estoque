/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.jsx',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d2724', // Ink quase-preto (botões e elementos sólidos)
          dark: '#5b4842',
          50: '#efe9e2',
        },
        secondary: {
          DEFAULT: '#d5a0a2', // Rosa empoeirado (acento da boutique)
          dark: '#a96d6e',
        },
        surface: '#fbf8f3', // Cartões e painéis
        ink: '#2d2724', // Texto principal
        muted: '#766e68', // Texto secundário
        'muted-light': '#998b82', // Texto terciário / labels
        border: '#ded3c8',
        'brand-bg': '#f4efe8', // Fundo creme
        danger: '#c1666b',
        success: '#7a966e',
        warning: '#c98a52',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
