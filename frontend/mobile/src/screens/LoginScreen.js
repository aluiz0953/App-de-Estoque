import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { flushQueue } from '../services/syncManager';
import apiService from '../services/api';
import LoginBackground from '../components/LoginBackground';
import Toggle from '../components/Toggle';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const LOGO = require('../assets/logo-tico-e-tica.png');

const emptyRegisterForm = { fullName: '', username: '', email: '', password: '' };

const LoginScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);

  const { isAuthenticating } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // No explicit navigate('Home') - AppNavigator swaps to the
      // authenticated screens as soon as isAuthenticated flips true.
      await dispatch(login({ username, password, rememberMe })).unwrap();
      flushQueue(); // retry anything left pending from before the session died
    } catch (err) {
      setError(err.message || err || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const updateRegister = (field) => (value) => setRegisterForm((prev) => ({ ...prev, [field]: value }));

  // Same public self-registration as the web login: the account stays pending
  // until an admin activates it.
  const handleRegister = async () => {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const result = await apiService.register({
        username: registerForm.username,
        email: registerForm.email,
        fullName: registerForm.fullName,
        passwordHash: registerForm.password, // API takes the plain password on this field; the server hashes it
      });
      setRegisterSuccess(result?.message || 'Conta criada. Aguarde um administrador liberar seu acesso.');
      setRegisterForm(emptyRegisterForm);
    } catch (err) {
      setRegisterError(err.message || 'Erro ao criar conta');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.secondaryDark} />
      </View>
    );
  }

  const loginDisabled = !username || !password;
  const registerDisabled =
    isRegistering || !registerForm.fullName || !registerForm.username || !registerForm.email || !registerForm.password;

  return (
    <View style={styles.screen}>
      <LoginBackground />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Tico e Tica" />
              <Text style={styles.eyebrow}>TICO E TICA · PERFUMARIA</Text>
              <Text style={styles.title} accessibilityRole="header">Sistema de Estoque</Text>
            </View>

            {mode === 'login' ? (
              <>
                <Text style={styles.label}>USUÁRIO</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Digite seu usuário"
                  accessibilityLabel="Usuário"
                  autoComplete="username"
                  textContentType="username"
                  placeholderTextColor={colors.textMutedLight}
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Text style={[styles.label, styles.fieldGap]}>SENHA</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    accessibilityLabel="Senha"
                    autoComplete="current-password"
                    textContentType="password"
                    placeholderTextColor={colors.textMutedLight}
                    secureTextEntry={!showPassword}
                    style={[styles.input, styles.passwordInput]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.showPasswordBtn}
                    hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Text style={styles.linkText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.rememberRow}>
                  <Toggle value={rememberMe} onValueChange={setRememberMe} accessibilityLabel="Manter conectado" />
                  <Text style={styles.rememberText} onPress={() => setRememberMe((v) => !v)} importantForAccessibility="no">
                    Manter conectado
                  </Text>
                </View>

                {error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text>}

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loginDisabled}
                  style={[styles.button, loginDisabled && styles.buttonDisabled]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loginDisabled }}
                >
                  <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => switchMode('register')} style={styles.switchLink} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={styles.linkText}>Criar conta</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>NOME COMPLETO</Text>
                <TextInput value={registerForm.fullName} onChangeText={updateRegister('fullName')} accessibilityLabel="Nome completo" autoComplete="name" style={styles.input} />

                <Text style={[styles.label, styles.fieldGap]}>USUÁRIO</Text>
                <TextInput
                  value={registerForm.username}
                  onChangeText={updateRegister('username')}
                  accessibilityLabel="Usuário"
                  autoComplete="username-new"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Text style={[styles.label, styles.fieldGap]}>E-MAIL</Text>
                <TextInput
                  value={registerForm.email}
                  onChangeText={updateRegister('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="E-mail"
                  autoComplete="email"
                  style={styles.input}
                />

                <Text style={[styles.label, styles.fieldGap]}>SENHA</Text>
                <TextInput
                  value={registerForm.password}
                  onChangeText={updateRegister('password')}
                  secureTextEntry
                  accessibilityLabel="Senha"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  style={styles.input}
                />

                <Text style={styles.hint}>Sua conta fica pendente até um administrador liberar o acesso.</Text>

                {registerError && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{registerError}</Text>}
                {registerSuccess && <Text style={styles.success} accessibilityLiveRegion="polite">{registerSuccess}</Text>}

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={registerDisabled}
                  style={[styles.button, registerDisabled && styles.buttonDisabled]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: registerDisabled, busy: isRegistering }}
                >
                  <Text style={styles.buttonText}>{isRegistering ? 'Criando conta...' : 'Criar conta'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => switchMode('login')} style={styles.switchLink} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={styles.linkText}>Já tenho conta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    // Same soft lift as the web card.
    shadowColor: '#203d2b',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 6,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 132, height: 90, marginBottom: 14 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.textMutedLight, marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.textMutedLight, marginBottom: 6 },
  fieldGap: { marginTop: 16 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 72 },
  showPasswordBtn: { position: 'absolute', right: 14 },
  linkText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.secondaryDark },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, alignSelf: 'flex-start' },
  rememberText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, marginLeft: 10 },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMutedLight, marginTop: 14 },
  error: { fontFamily: fonts.sans, color: colors.error, marginTop: 12, fontSize: 13 },
  success: { fontFamily: fonts.sans, color: colors.success, marginTop: 12, fontSize: 13 },
  button: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.primaryLight },
  switchLink: { alignSelf: 'center', marginTop: 16, padding: 4 },
});

export default LoginScreen;
