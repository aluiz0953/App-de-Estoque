import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, TextInput, Card, Title, Paragraph, Caption } from 'react-native-paper';
import { login } from '../store/slices/authSlice';
import { useNavigate } from '../hooks/useNavigate';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticating } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await dispatch(login({ username, password })).unwrap();
      navigate('Home');
    } catch (err) {
      setError(err.message || err || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: colors.background, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <MaterialCommunityIcons
          name="store"
          size={64}
          color={colors.primary}
          style={{ marginBottom: 16 }}
        />
        <Title>Perfumaria Estoque</Title>
        <Caption>Sistema de Gestão de Estoque</Caption>
      </View>

      <Card elevation={3}>
        <View style={{ padding: 24 }}>
          <Title>Login</Title>

          <TextInput
            label="Usuário"
            value={username}
            onChangeText={setUsername}
            placeholder="Digite seu usuário"
            mode="outlined"
            style={{ marginBottom: 16 }}
            autoCapitalize="none"
          />

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            mode="outlined"
            secureTextEntry
            style={{ marginBottom: 8 }}
          />

          {error && (
            <Paragraph style={{ color: colors.error, marginBottom: 16 }}>{error}</Paragraph>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={!username || !password}
            buttonColor={colors.primary}
            style={{ marginTop: 8 }}
          >
            Entrar
          </Button>

          <Text style={{ textAlign: 'center', marginTop: 16, color: colors.textMuted, fontSize: 14 }}>
            Usuário: admin / senha: admin123
          </Text>
        </View>
      </Card>
    </View>
  );
};

export default LoginScreen;
