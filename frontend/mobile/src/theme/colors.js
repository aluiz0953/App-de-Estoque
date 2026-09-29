// Design system — matches frontend/web's boutique palette (Tailwind tokens in
// frontend/web/tailwind.config.js) so the mobile app looks like the same product.
// Components read the active palette through useTheme() (see ThemeContext.js).
export const lightColors = {
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

  // Screen headers and the dark metric card, the rose card, modal scrim.
  headerBg: '#2d2724',
  headerInk: '#efe9e2',
  headerSoft: 'rgba(248,242,234,0.65)',
  headerLine: 'rgba(248,242,234,0.3)',
  roseBg: '#ead8d1',
  roseInk: '#5c4540',
  roseSoft: 'rgba(92,69,64,0.65)',
  overlay: 'rgba(45,39,36,0.4)',

  toggleOn: '#2d2724',
  toggleOff: '#ded3c8',
  toggleThumb: '#ffffff',

  // Floating dock (BottomTabBar).
  dockBg: '#2d2724',
  dockLine: 'rgba(255,255,255,0)',
  dockInk: '#efe9e2',
  dockInkSoft: 'rgba(239,233,226,0.62)',
  dockBubble: 'rgba(213,160,162,0.28)',
};

// Dark counterpart. `primary`/`primaryLight` swap roles (a solid button becomes cream with ink
// text), so every "solid primary + primaryLight text" pair keeps its contrast, and text that
// uses `primary` stays readable on the dark background.
export const darkColors = {
  primary: '#efe9e2',
  primaryDark: '#cdbfb3',
  primaryLight: '#2d2724',
  secondary: '#d5a0a2',
  secondaryDark: '#c98b8d',
  background: '#151110',
  surface: '#1f1a17',
  text: '#efe9e2',
  textMuted: '#a99f97',
  textMutedLight: '#8b8078',
  border: '#382f2a',
  error: '#d67b80',
  success: '#93b085',
  warning: '#d9a06a',
  disabled: '#4a413b',

  successBg: '#25322a',
  successInk: '#a9c79c',
  warningBg: '#3b2c22',
  warningInk: '#e0aa85',
  neutralBg: '#2f2926',
  neutralInk: '#b5aaa3',

  headerBg: '#2b2320',
  headerInk: '#efe9e2',
  headerSoft: 'rgba(239,233,226,0.6)',
  headerLine: 'rgba(239,233,226,0.25)',
  roseBg: '#3a2a27',
  roseInk: '#efd6cf',
  roseSoft: 'rgba(239,214,207,0.65)',
  overlay: 'rgba(0,0,0,0.6)',

  toggleOn: '#b97c7e',
  toggleOff: '#4a413b',
  toggleThumb: '#fbf8f3',

  dockBg: '#2a2320',
  dockLine: 'rgba(255,255,255,0.08)',
  dockInk: '#efe9e2',
  dockInkSoft: 'rgba(239,233,226,0.6)',
  dockBubble: 'rgba(213,160,162,0.24)',
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
