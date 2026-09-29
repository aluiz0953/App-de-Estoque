import React, { useEffect, useMemo } from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { store, persistor } from './src/store';
import { logoutUser } from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider, NOTCH_MIN_TOP_INSET, useStatusInset } from './src/components/Toast';
import { startSyncManager } from './src/services/syncManager';
import { onUnauthorized } from './src/services/api';
import { fonts } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// Mirrors frontend/web's boutique palette + type system inside react-native-paper's
// MD3 theme, so Paper components (Button, TextInput, Card...) pick it up everywhere
// without needing per-screen overrides.
const paperFonts = configureFonts({ config: { fontFamily: fonts.sans } });
const buildPaperTheme = (colors, isDark) => {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    fonts: paperFonts,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.primaryLight,
      secondary: colors.secondary,
      onSecondary: '#2d2724',
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.text,
      surfaceVariant: colors.background,
      onSurfaceVariant: colors.textMuted,
      outline: colors.border,
      error: colors.error,
      inverseSurface: colors.primary,
      inverseOnSurface: colors.primaryLight,
    },
  };
};

// React Navigation paints its own background behind screens during transitions.
const buildNavTheme = (colors, isDark) => {
  const base = isDark ? DarkTheme : DefaultTheme;
  return { ...base, colors: { ...base.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.secondaryDark } };
};

// On phones with a camera cutout the status bar becomes transparent so the notification
// island (see Toast.js) can sit around the notch; the app content is pushed down by the
// same inset (done by ToastProvider), so every screen looks as it did with a solid bar.
function Shell({ children }) {
  const { colors, isDark } = useTheme();
  const statusInset = useStatusInset();
  const hasNotch = statusInset > NOTCH_MIN_TOP_INSET;
  return (
    <>
      <StatusBar translucent={hasNotch} backgroundColor="transparent" barStyle={hasNotch && !isDark ? 'dark-content' : 'light-content'} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>
    </>
  );
}

function Themed() {
  const { colors, isDark } = useTheme();
  const paperTheme = useMemo(() => buildPaperTheme(colors, isDark), [colors, isDark]);
  const navTheme = useMemo(() => buildNavTheme(colors, isDark), [colors, isDark]);
  return (
    <PaperProvider theme={paperTheme}>
      <Shell>
        <ToastProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </Shell>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    startSyncManager();
    // A 401 means the server-side session is gone (in-memory, wiped on every
    // backend redeploy) even though redux-persist still thinks we're logged
    // in - clear that stale state so AppNavigator drops back to Login instead
    // of leaving every screen quietly 401ing.
    return onUnauthorized(() => store.dispatch(logoutUser()));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <Themed />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
