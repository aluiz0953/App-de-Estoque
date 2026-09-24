import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { flushQueue } from '../services/syncManager';
import { colors, fonts } from '../theme/colors';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticating } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // No explicit navigate('Home') - AppNavigator swaps to the
      // authenticated screens as soon as isAuthenticated flips true.
      await dispatch(login({ username, password })).unwrap();
      flushQueue(); // retry anything left pending from before the session died
    } catch (err) {
      setError(err.message || err || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.secondaryDark} />
      </View>
    );
  }

  const disabled = !username || !password;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoDot}>
          <View style={styles.logoDotInner} />
        </View>
        <Text style={styles.eyebrow}>PERFUMARIA</Text>
        <Text style={styles.title}>Sistema de Estoque</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login</Text>

        <Text style={styles.label}>USUÁRIO</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Digite seu usuário"
          placeholderTextColor={colors.textMutedLight}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>SENHA</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            placeholderTextColor={colors.textMutedLight}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.showPasswordBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.showPasswordText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={disabled}
          style={[styles.button, disabled && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  screen: { flex: 1, padding: 24, backgroundColor: colors.background, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.textMutedLight, marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text, marginBottom: 16 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.textMutedLight, marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: { fontFamily: fonts.sans, color: colors.error, marginTop: 12, fontSize: 13 },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 72 },
  showPasswordBtn: { position: 'absolute', right: 14 },
  showPasswordText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.secondaryDark },
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.primaryLight },
});

export default LoginScreen;
