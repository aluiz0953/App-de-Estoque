// Design system — matches frontend/web's boutique palette (Tailwind tokens in
// frontend/web/tailwind.config.js) so the mobile app looks like the same product.
export const colors = {
  primary: '#2d2724', // Ink quase-preto (botões e elementos sólidos)
  primaryDark: '#5b4842',
  primaryLight: '#efe9e2', // texto claro sobre fundo escuro / tint claro
  secondary: '#d5a0a2', // Rosa empoeirado (acento da boutique)
  secondaryDark: '#a96d6e',
  background: '#f4efe8', // Fundo creme
  surface: '#fbf8f3', // Cartões e painéis
  text: '#2d2724', // Texto principal
  textMuted: '#766e68', // Texto secundário
  textMutedLight: '#998b82', // Texto terciário / labels
  border: '#ded3c8',
  error: '#c1666b',
  success: '#7a966e',
  warning: '#c98a52',
  disabled: '#c9beb4',

  // StatusPill badge pairs (bg/ink) — same tones UsersPage.jsx uses on the web app,
  // so "Available"/"Low stock"/"Out of stock" read consistently across platforms.
  successBg: '#dce6d8',
  successInk: '#5f7658',
  warningBg: '#f0d6c5',
  warningInk: '#94634d',
  neutralBg: '#ded7d4',
  neutralInk: '#716562',
};

export const fonts = {
  display: 'PlayfairDisplay-SemiBold', // headings
  displayRegular: 'PlayfairDisplay-Medium',
  sans: 'DMSans-Regular', // body
  sansMedium: 'DMSans-Medium',
  sansBold: 'DMSans-Bold',
  mono: 'DMMono-Medium', // eyebrow / uppercase labels
};

// Applied to any Text showing SKUs, EANs or quantities, per the design system spec.
export const tabularNums = { fontVariant: ['tabular-nums'] };
