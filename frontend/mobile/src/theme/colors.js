// Design system "Tico e Tica" - same palette as frontend/web (Tailwind tokens in
// frontend/web/tailwind.config.js) so the mobile app looks like the same product:
// brand green (primary) + brand pink (secondary) on a soft green-grey canvas.
// Components read the active palette through useTheme() (see ThemeContext.js).
export const lightColors = {
  primary: '#239e4b', // Verde Tico (botoes e elementos solidos)
  primaryDark: '#147a37',
  primaryLight: '#f4fbf6', // texto claro sobre o verde / sobre o cabecalho
  secondary: '#dd6383', // Rosa Tica (acento)
  secondaryDark: '#ba4566',
  background: '#f7f9f7',
  surface: '#ffffff',
  text: '#17201b',
  textMuted: '#5f6962',
  textMutedLight: '#6b746e',
  border: '#e7ebe8',
  error: '#b94a45',
  success: '#1b8a40',
  warning: '#a8691a',
  disabled: '#c5cdc8',

  // Icon/product tiles of the dashboard (Figma): bg + ink per tone.
  tileGreenBg: '#eaf7ee',
  tileGreenInk: '#147a37',
  tilePinkBg: '#fbeef2',
  tilePinkInk: '#ba4566',
  tileRoseBg: '#fff0ee',
  tileRoseInk: '#bc5b58',
  tilePurpleBg: '#f4eff8',
  tilePurpleInk: '#765394',

  // StatusPill badge pairs (bg/ink) - same tones the web pages use.
  successBg: '#eaf7ee',
  successInk: '#147a37',
  warningBg: '#fdf0d9',
  warningInk: '#8a5a12',
  neutralBg: '#eceeed',
  neutralInk: '#5f6762',

  // Screen headers and the dark metric card, the rose card, modal scrim.
  headerBg: '#147a37',
  headerInk: '#ffffff',
  headerSoft: 'rgba(255,255,255,0.78)',
  headerLine: 'rgba(255,255,255,0.4)',
  roseBg: '#fbeef2',
  roseInk: '#8f2f4c',
  roseSoft: 'rgba(143,47,76,0.7)',
  overlay: 'rgba(23,32,27,0.4)',

  toggleOn: '#239e4b',
  toggleOff: '#d5dcd7',
  toggleThumb: '#ffffff',

  // Floating dock (BottomTabBar).
  dockBg: '#17201b',
  dockLine: 'rgba(255,255,255,0)',
  dockInk: '#eaf0ec',
  dockInkSoft: 'rgba(234,240,236,0.62)',
  dockBubble: 'rgba(221,99,131,0.3)',
};

// Dark counterpart. The green is lifted a step so it holds on dark surfaces, and the text on it
// turns dark (primary + primaryLight keep their contrast); text that uses `primary` stays readable.
export const darkColors = {
  primary: '#3dbb67',
  primaryDark: '#7fd49a',
  primaryLight: '#06200f',
  secondary: '#e8738f',
  secondaryDark: '#f08aa3',
  background: '#0f1411',
  surface: '#171e19',
  text: '#eaf0ec',
  textMuted: '#a3aea7',
  textMutedLight: '#8a968f',
  border: '#27312b',
  error: '#e57a74',
  success: '#6fcf8c',
  warning: '#e0a44a',
  disabled: '#3a453e',

  tileGreenBg: '#17301f',
  tileGreenInk: '#8fd9a6',
  tilePinkBg: '#33202a',
  tilePinkInk: '#f08aa3',
  tileRoseBg: '#35201e',
  tileRoseInk: '#e8908a',
  tilePurpleBg: '#2a2236',
  tilePurpleInk: '#c4a8de',

  successBg: '#17301f',
  successInk: '#8fd9a6',
  warningBg: '#35290f',
  warningInk: '#e8b869',
  neutralBg: '#222a25',
  neutralInk: '#b3beb7',

  headerBg: '#12301c',
  headerInk: '#eaf0ec',
  headerSoft: 'rgba(234,240,236,0.65)',
  headerLine: 'rgba(234,240,236,0.28)',
  roseBg: '#33202a',
  roseInk: '#f6cdd9',
  roseSoft: 'rgba(246,205,217,0.7)',
  overlay: 'rgba(0,0,0,0.6)',

  toggleOn: '#3dbb67',
  toggleOff: '#3a453e',
  toggleThumb: '#ffffff',

  dockBg: '#1a2420',
  dockLine: 'rgba(255,255,255,0.08)',
  dockInk: '#eaf0ec',
  dockInkSoft: 'rgba(234,240,236,0.6)',
  dockBubble: 'rgba(232,115,143,0.26)',
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
