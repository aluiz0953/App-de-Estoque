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
          DEFAULT: '#2d2724', // Ink quase-preto (botões e elementos sólidos) - fixo em ambos os temas
          dark: '#5b4842',
          50: '#efe9e2',
        },
        secondary: {
          DEFAULT: '#d5a0a2', // Rosa empoeirado (acento da boutique) - fixo em ambos os temas
          dark: '#a96d6e',
        },
        // Estes seguem variáveis CSS (ver src/App.css) para responder ao tema claro/escuro
        surface: 'var(--color-surface)', // Cartões e painéis
        ink: 'var(--color-ink)', // Texto principal
        muted: 'var(--color-muted)', // Texto secundário
        'muted-light': 'var(--color-muted-light)', // Texto terciário / labels
        border: 'var(--color-border)',
        'brand-bg': 'var(--color-brand-bg)', // Fundo
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
