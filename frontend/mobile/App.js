import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider, MD3LightTheme, configureFonts } from 'react-native-paper';
import { store, persistor } from './src/store';
import { logoutUser } from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/Toast';
import { startSyncManager } from './src/services/syncManager';
import { onUnauthorized } from './src/services/api';
import { colors, fonts } from './src/theme/colors';

// Mirrors frontend/web's boutique palette + type system inside react-native-paper's
// MD3 theme, so Paper components (Button, TextInput, Card...) pick it up everywhere
// without needing per-screen overrides.
const paperTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: { fontFamily: fonts.sans } }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.primaryLight,
    secondary: colors.secondary,
    onSecondary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    surfaceVariant: colors.background,
    onSurfaceVariant: colors.textMuted,
    outline: colors.border,
    error: colors.error,
  },
};

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
            <PaperProvider theme={paperTheme}>
              <ToastProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </ToastProvider>
            </PaperProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
