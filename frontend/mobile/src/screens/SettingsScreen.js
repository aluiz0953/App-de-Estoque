import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { logout, logoutUser } from '../store/slices/authSlice';
import { setDarkMode } from '../store/slices/settingsSlice';
import apiService from '../services/api';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { useDockClearance } from '../components/BottomTabBar';
import Toggle from '../components/Toggle';
import { decorative, slopFor } from '../utils/a11y';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { removeFromQueue, markPending } from '../services/offlineQueue';
import { flushQueue } from '../services/syncManager';
import { MOTIVO_LABEL } from '../utils/motivos';

const ALERT_ENABLED_KEY = 'settings:lowStockAlertEnabled';
const ALERT_THRESHOLD_KEY = 'settings:lowStockAlertThreshold';

const ROLE_LABEL = { ADMIN: 'Administrador', MANAGER: 'Gerente', OPERATOR: 'Operador', AUDITOR: 'Auditor' };

const SettingsScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const dockClearance = useDockClearance();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionUser = useSelector((state) => state.auth.user);
  const darkMode = useSelector((state) => state.settings.darkMode);

  const [profile, setProfile] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [threshold, setThreshold] = useState('5');
  const isOnline = useNetworkStatus();
  const { pending, conflicts, syncing, refresh } = useSyncQueue();

  useEffect(() => {
    apiService.getProfile().then(setProfile).catch(() => {});
    AsyncStorage.multiGet([ALERT_ENABLED_KEY, ALERT_THRESHOLD_KEY]).then((pairs) => {
      const [[, enabledStr], [, thresholdStr]] = pairs;
      if (enabledStr != null) setAlertsEnabled(enabledStr === 'true');
      if (thresholdStr != null) setThreshold(thresholdStr);
    });
  }, []);

  const toggleAlerts = (value) => {
    setAlertsEnabled(value);
    AsyncStorage.setItem(ALERT_ENABLED_KEY, String(value));
  };

  const saveThreshold = (value) => {
    const digits = value.replace(/[^0-9]/g, '');
    setThreshold(digits);
    AsyncStorage.setItem(ALERT_THRESHOLD_KEY, digits || '0');
  };

  const handleDiscardConflict = async (id) => {
    await removeFromQueue(id);
    refresh();
  };

  const handleRetryConflict = async (id) => {
    await markPending(id);
    refresh();
    flushQueue();
  };

  const handleLogout = async () => {
    // No explicit navigate() needed - AppNavigator renders only the Login
    // screen once isAuthenticated flips to false, same as an api.js-triggered
    // forced logout.
    try {
      await dispatch(logout()).unwrap();
    } catch {
      dispatch(logoutUser());
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: dockClearance }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONTA</Text>
        <Text style={styles.title} accessibilityRole="header">Configurações</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Perfil</Text>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.fullName || profile?.username || '??').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.fullName || sessionUser?.user || '...'}</Text>
            <Text style={[styles.profileMeta, tabularNums]}>
              {profile?.username || sessionUser?.user} · {ROLE_LABEL[profile?.role || sessionUser?.role] || profile?.role}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Aparência</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name={darkMode ? 'weather-night' : 'white-balance-sunny'} size={20} color={colors.textMuted} style={{ marginRight: 12 }} {...decorative} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Tema escuro</Text>
              <Text style={styles.rowSubtitle}>{darkMode ? 'Escuro' : 'Claro'} · preferência salva neste aparelho.</Text>
            </View>
            <Toggle value={darkMode} onValueChange={(value) => dispatch(setDarkMode(value))} accessibilityLabel="Tema escuro" />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Alertas de estoque baixo</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Notificar estoque baixo</Text>
              <Text style={styles.rowSubtitle}>Preferência salva apenas neste aparelho.</Text>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={toggleAlerts}
              accessibilityLabel="Notificar estoque baixo"
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.surface}
            />
          </View>
          {alertsEnabled && (
            <View style={[styles.row, { marginTop: 14 }]}>
              <Text style={styles.rowTitle}>Limite padrão</Text>
              <TextInput
                value={threshold}
                onChangeText={saveThreshold}
                keyboardType="number-pad"
                accessibilityLabel="Limite padrão de estoque baixo, em unidades"
                style={styles.thresholdInput}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sincronização</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.syncDot, { backgroundColor: isOnline ? colors.success : colors.error }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{isOnline ? 'Conectado' : 'Sem conexão'}</Text>
              <Text style={styles.rowSubtitle}>
                {syncing
                  ? 'Sincronizando alterações pendentes...'
                  : pending.length > 0
                  ? `${pending.length} alteração${pending.length === 1 ? '' : 'ões'} de estoque aguardando conexão.`
                  : 'Nenhuma alteração pendente.'}
              </Text>
            </View>
          </View>

          {conflicts.length > 0 && (
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border }}>
              <Text style={styles.conflictHeader}>
                {conflicts.length} conflito{conflicts.length === 1 ? '' : 's'} precisa{conflicts.length === 1 ? '' : 'm'} de revisão
              </Text>
              {conflicts.map((c) => (
                <View key={c.id} style={styles.conflictCard}>
                  <Text style={styles.conflictProduct}>{c.productSnapshot?.nome || 'Produto'}</Text>
                  <Text style={styles.conflictDetail}>
                    {c.type === 'ENTRADA' ? 'Entrada' : 'Saída'} · {c.payload?.quantidade} un. ·{' '}
                    {MOTIVO_LABEL[c.payload?.motivo] || c.payload?.motivo}
                  </Text>
                  <Text style={styles.conflictReason}>{c.conflictReason}</Text>
                  <View style={styles.conflictActions}>
                    <TouchableOpacity
                      onPress={() => handleDiscardConflict(c.id)}
                      hitSlop={slopFor(20)}
                      accessibilityRole="button"
                      accessibilityLabel={`Descartar a alteração de ${c.productSnapshot?.nome || 'produto'}`}
                    >
                      <Text style={styles.conflictDiscard}>Descartar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRetryConflict(c.id)}
                      hitSlop={slopFor(20)}
                      accessibilityRole="button"
                      accessibilityLabel={`Tentar novamente a alteração de ${c.productSnapshot?.nome || 'produto'}`}
                    >
                      <Text style={styles.conflictRetry}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Central de ajuda</Text>
        <View style={styles.card}>
          <View style={styles.helpRow}>
            <MaterialCommunityIcons name="history" size={18} color={colors.textMuted} {...decorative} />
            <TouchableOpacity
              onPress={() => navigate('Histórico')}
              style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}
              accessibilityRole="button"
              accessibilityHint="Abre a lista de movimentações de estoque"
            >
              <Text style={styles.helpText}>Histórico de movimentações</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.disabled} {...decorative} />
          </View>
          <View style={styles.helpDivider} />
          <View style={styles.helpRow}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.textMuted} {...decorative} />
            <Text style={styles.helpText}>Dúvidas ou problemas? Fale com o administrador do sistema.</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutBtn}
        accessibilityRole="button"
        accessibilityHint="Encerra a sessão neste aparelho"
      >
        <MaterialCommunityIcons name="logout" size={16} color={colors.error} {...decorative} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.headerBg,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.headerInk,
    opacity: 0.65,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.headerInk,
    fontSize: 22,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMutedLight,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.primary,
  },
  profileName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  profileMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  thresholdInput: {
    width: 56,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    color: colors.text,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 10,
  },
  conflictHeader: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.error,
    marginBottom: 10,
  },
  conflictCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  conflictProduct: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text,
  },
  conflictDetail: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  conflictReason: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.error,
    marginTop: 4,
  },
  conflictActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  conflictDiscard: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  conflictRetry: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.secondaryDark,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  helpText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  helpDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.error,
  },
});

export default SettingsScreen;
