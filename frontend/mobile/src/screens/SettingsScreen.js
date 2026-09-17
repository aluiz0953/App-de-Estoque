import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { logout, logoutUser } from '../store/slices/authSlice';
import apiService from '../services/api';
import { colors, fonts, tabularNums } from '../theme/colors';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { removeFromQueue, markPending } from '../services/offlineQueue';
import { flushQueue } from '../services/syncManager';
import { MOTIVO_LABEL } from '../utils/motivos';

const ALERT_ENABLED_KEY = 'settings:lowStockAlertEnabled';
const ALERT_THRESHOLD_KEY = 'settings:lowStockAlertThreshold';

const ROLE_LABEL = { ADMIN: 'Administrador', MANAGER: 'Gerente', OPERATOR: 'Operador', AUDITOR: 'Auditor' };

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionUser = useSelector((state) => state.auth.user);

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
    try {
      await dispatch(logout()).unwrap();
    } catch {
      dispatch(logoutUser());
    }
    navigate('Login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONTA</Text>
        <Text style={styles.title}>Configurações</Text>
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
                    <TouchableOpacity onPress={() => handleDiscardConflict(c.id)}>
                      <Text style={styles.conflictDiscard}>Descartar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRetryConflict(c.id)}>
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
            <MaterialCommunityIcons name="history" size={18} color={colors.textMuted} />
            <TouchableOpacity onPress={() => navigate('Histórico')} style={{ flex: 1 }}>
              <Text style={styles.helpText}>Histórico de movimentações</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.disabled} />
          </View>
          <View style={styles.helpDivider} />
          <View style={styles.helpRow}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.helpText}>Dúvidas ou problemas? Fale com o administrador do sistema.</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primaryLight,
    opacity: 0.65,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.primaryLight,
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
    height: 36,
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
