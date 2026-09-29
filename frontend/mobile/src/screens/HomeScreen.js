import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import { useNavigate } from '../hooks/useNavigate';
import { colors, fonts, tabularNums } from '../theme/colors';
import MetricCard from '../components/MetricCard';
import QuickActionCard from '../components/QuickActionCard';
import SyncIndicator from '../components/SyncIndicator';
import StatusPill from '../components/StatusPill';
import { getStockState } from '../utils/stock';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

const formatDate = () =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date());

// Tela 01 — Hoje. Answers "how much is available, what needs attention, what's
// the next action" in one screen (spec §2 "Clareza antes de completude").
const HomeScreen = () => {
  const { data: produtos, isLoading, error, refetch } = useFetchProducts();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { pending, conflicts, syncing } = useSyncQueue();

  const ativos = useMemo(() => (produtos || []).filter((p) => p.active !== false), [produtos]);

  const stats = useMemo(() => {
    const unidades = ativos.reduce((sum, p) => sum + (p.quantidadeTotal || 0), 0);
    const baixo = ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) === 'low').length;
    const sem = ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) === 'out').length;
    return { unidades, ativos: ativos.length, baixo, sem };
  }, [ativos]);

  const atencao = useMemo(
    () => ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) !== 'available'),
    [ativos]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ESTOQUE</Text>
        <Text style={styles.headerText}>Dashboard</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>{formatDate()}</Text>
                <Text style={styles.greeting}>
                  Visão geral <Text style={styles.greetingAccent}>de hoje.</Text>
                </Text>
              </View>
            </View>
            <SyncIndicator
              status={
                !isOnline
                  ? 'offline'
                  : conflicts.length > 0
                  ? 'stale'
                  : syncing || (isOnline && pending.length > 0)
                  ? 'syncing'
                  : error
                  ? 'stale'
                  : isLoading
                  ? 'syncing'
                  : 'synced'
              }
              label={
                conflicts.length > 0
                  ? `${conflicts.length} conflito${conflicts.length === 1 ? '' : 's'} de sincronização`
                  : !isOnline && pending.length > 0
                  ? `Sem conexão · ${pending.length} pendente${pending.length === 1 ? '' : 's'}`
                  : undefined
              }
              onRetry={refetch}
              style={{ marginTop: 12 }}
            />

            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : error ? (
              <Text style={styles.errorText}>{error.message}</Text>
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <MetricCard label="Unidades disponíveis" value={stats.unidades} variant="dark" icon={<MaterialCommunityIcons name="cube-outline" size={16} color="rgba(248,242,234,0.65)" />} />
                  <MetricCard label="Produtos ativos" value={stats.ativos} icon={<MaterialCommunityIcons name="bottle-tonic-outline" size={16} color={colors.textMutedLight} />} />
                  <MetricCard label="Estoque baixo" value={stats.baixo} variant="rose" icon={<MaterialCommunityIcons name="arrow-down-thin" size={16} color="rgba(92,69,64,0.65)" />} />
                  <MetricCard label="Sem estoque" value={stats.sem} icon={<MaterialCommunityIcons name="archive-outline" size={16} color={colors.textMutedLight} />} />
                </View>

                <View style={styles.actionsRow}>
                  <QuickActionCard
                    icon="plus-circle-outline"
                    title="Adicionar produto"
                    description="Cadastrar um novo item no catálogo"
                    onPress={() => navigate('AddEditProduct')}
                  />
                  <QuickActionCard
                    icon="package-down"
                    title="Receber estoque"
                    description="Entrada de romaneio"
                    onPress={() => navigate('EntradaRomaneio')}
                  />
                </View>

                <Text style={styles.sectionTitle}>Itens que exigem atenção</Text>
              </>
            )}
          </View>
        }
        data={isLoading || error ? [] : atencao}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const state = getStockState(item.quantidadeTotal, item.estoqueMinimo);
          return (
            <TouchableOpacity style={styles.attentionRow} onPress={() => navigate('ProductDetail', { productId: item.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={[styles.itemMeta, tabularNums]}>
                  {item.sku} · <Text style={tabularNums}>{item.quantidadeTotal ?? 0}</Text> un.
                </Text>
              </View>
              <StatusPill state={state} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.success} />
              <Text style={styles.emptyText}>Tudo em ordem. Nenhum produto precisa de atenção agora.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primaryLight,
    opacity: 0.65,
    marginBottom: 4,
  },
  headerText: {
    fontFamily: fonts.display,
    color: colors.primaryLight,
    fontSize: 22,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  dateLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMutedLight,
  },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    marginTop: 6,
  },
  greetingAccent: {
    color: colors.secondaryDark,
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
    marginTop: 26,
    marginBottom: 4,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  itemMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMutedLight,
    textAlign: 'center',
    maxWidth: 240,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.error,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default HomeScreen;
