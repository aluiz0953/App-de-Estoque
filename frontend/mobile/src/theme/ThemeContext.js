import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { darkColors, lightColors } from './colors';

const ThemeContext = createContext({ colors: lightColors, isDark: false });

// The choice lives in the persisted `settings` slice (toggle in Configurações), so PersistGate
// has already rehydrated it before the first paint: no light flash for a dark-mode user.
export const ThemeProvider = ({ children }) => {
  const isDark = useSelector((state) => state.settings.darkMode);
  const value = useMemo(() => ({ isDark, colors: isDark ? darkColors : lightColors }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// { colors, isDark } for the active theme.
export const useTheme = () => useContext(ThemeContext);

// Themed styles: pass a `(colors) => StyleSheet.create({...})` factory defined at module level;
// the sheet is rebuilt only when the theme changes.
export function useThemedStyles(createStyles) {
  const { colors } = useContext(ThemeContext);
  return useMemo(() => ({ colors, styles: createStyles(colors) }), [colors, createStyles]);
}
