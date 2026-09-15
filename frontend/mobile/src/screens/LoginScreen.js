import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, TextInput, Card, Title, Paragraph } from 'react-native-paper';
import { login } from '../store/slices/authSlice';
import { useNavigate } from '../hooks/useNavigate';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticating, user, error: authError } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await dispatch(login({ username, password })).unwrap();
      // Login bem-sucedido, navega para a tela inicial
      navigate('Home');
    } catch (err) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B2C6F" />
      </View>
    );
  }

  if (error || authError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Card elevation={3}>
          <View style={{ padding: 24 }}>
            <Title>Erro de Login</Title>
            <Paragraph>{error || authError}</Paragraph>
            <Button mode="outlined" onPress={() => setError(null)} style={{ marginTop: 12 }}>
              OK
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#F8F9FA' }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <MaterialCommunityIcons
          name="store"
          size={64}
          color="#5B2C6F"
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
            style={{ marginBottom: 24 }}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={{ backgroundColor: '#5B2C6F' }}
          >
            Entrar
          </Button>

          <Text style={{ textAlign: 'center', marginTop: 16, color: '#7F8C8D', fontSize: 14 }}>
            Usuário: admin / senha: admin123
          </Text>
        </View>
      </Card>
    </View>
  );
};

export default LoginScreen;