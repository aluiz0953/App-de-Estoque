/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './App.jsx',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#239e4b', // Verde Tico (botões e elementos sólidos) - fixo em ambos os temas
          dark: '#147a37',
          50: '#eaf7ee',
        },
        secondary: {
          DEFAULT: '#dd6383', // Rosa Tica (acento) - fixo em ambos os temas
          dark: '#ba4566',
        },
        // Estes seguem variáveis CSS (ver src/App.css) para responder ao tema claro/escuro
        surface: 'var(--color-surface)', // Cartões e painéis
        ink: 'var(--color-ink)', // Texto principal
        muted: 'var(--color-muted)', // Texto secundário
        'muted-light': 'var(--color-muted-light)', // Texto terciário / labels
        border: 'var(--color-border)',
        'brand-bg': 'var(--color-brand-bg)', // Fundo
        danger: '#c95b55',
        success: '#1b8a40',
        warning: '#c2841f',
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Playfair Display Variable', 'Georgia', 'serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
