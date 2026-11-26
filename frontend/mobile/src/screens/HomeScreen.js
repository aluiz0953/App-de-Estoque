import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import useFetchEstoqueResumo from '../hooks/useFetchEstoqueResumo';
import { useNavigate } from '../hooks/useNavigate';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { useDockClearance } from '../components/BottomTabBar';
import MetricTile from '../components/MetricTile';
import RowIn from '../components/RowIn';
import UpdateBanner from '../components/UpdateBanner';
import MovimentacoesPanel from '../components/MovimentacoesPanel';
import RecentProductsPanel from '../components/RecentProductsPanel';
import QuickActionCard from '../components/QuickActionCard';
import SyncIndicator from '../components/SyncIndicator';
import StatusPill from '../components/StatusPill';
import { getStockState, STOCK_STATE_LABEL } from '../utils/stock';
import { decorative } from '../utils/a11y';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

import { money } from '../utils/money';

// Tela 01 — Hoje, in the Figma dashboard layout: greeting, four metrics, Movimentações, recent products
// and the attention card. The floating dock stays at the bottom (see useDockClearance).
const HomeScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const dockClearance = useDockClearance();
  const { data: produtos, isLoading, error, refetch } = useFetchProducts();
  const { data: resumo } = useFetchEstoqueResumo();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { pending, conflicts, syncing } = useSyncQueue();

  const ativos = useMemo(() => (produtos || []).filter((p) => p.active !== false), [produtos]);

  const stats = useMemo(() => {
    const baixo = ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) === 'low').length;
    const sem = ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) === 'out').length;
    return { ativos: ativos.length, baixo, sem };
  }, [ativos]);

  const atencao = useMemo(
    () => ativos.filter((p) => getStockState(p.quantidadeTotal, p.estoqueMinimo) !== 'available'),
    [ativos]
  );
  const recentes = useMemo(() => [...ativos].sort((a, b) => b.id - a.id).slice(0, 5), [ativos]);

  const nome = String(user?.user || user?.username || '').split(' ')[0];
  const nomeCapitalizado = nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.headerText} accessibilityRole="header">Painel</Text>
      </View>

      <FlatList
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: dockClearance }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={styles.greeting}>
              Olá{nomeCapitalizado ? `, ${nomeCapitalizado}` : ''}.{' '}
              {atencao.length > 0 ? 'Alguns itens pedem atenção.' : 'Seu estoque está sob controle.'}
            </Text>

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
            <UpdateBanner />

            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : error ? (
              <Text style={styles.errorText}>{error.message}</Text>
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <MetricTile
                    label="Produtos ativos"
                    value={resumo?.totalProdutos ?? stats.ativos}
                    detail={`${resumo?.totalLotesAtivos ?? 0} lotes ativos`}
                    icon="cube-outline"
                    tone="green"
                    onPress={() => navigate('Estoque', { status: 'Todos' })}
                  />
                  <MetricTile label="Valor do estoque" value={money(resumo?.valorTotalEstoque)} detail="Preço de venda em estoque" icon="chart-bar" tone="pink" />
                  <MetricTile
                    label="Itens com estoque baixo"
                    value={stats.baixo + stats.sem}
                    detail={`${stats.sem} sem estoque`}
                    icon="alert-outline"
                    tone="rose"
                    onPress={() => navigate('Estoque', { status: 'low' })}
                  />
                  <MetricTile label="Lucro potencial" value={money(resumo?.lucroPotencial)} detail="Se tudo for vendido" icon="trending-up" tone="purple" />
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

                <MovimentacoesPanel />
                <RecentProductsPanel
                  produtos={recentes}
                  onOpen={(productId) => navigate('ProductDetail', { productId })}
                  onSeeAll={() => navigate('Estoque', { status: 'Todos' })}
                />

                <Text style={styles.sectionTitle} accessibilityRole="header">Itens que exigem atenção</Text>
              </>
            )}
          </View>
        }
        data={isLoading || error ? [] : atencao}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const state = getStockState(item.quantidadeTotal, item.estoqueMinimo);
          return (
            <RowIn index={index} style={index % 6 < 3 ? { backgroundColor: colors.band } : null}>
            <TouchableOpacity
              style={styles.attentionRow}
              onPress={() => navigate('ProductDetail', { productId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.nome}, SKU ${item.sku}, ${STOCK_STATE_LABEL[state]}, ${item.quantidadeTotal ?? 0} unidades`}
              accessibilityHint="Toque duas vezes para abrir os detalhes do produto"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  <Text style={{ backgroundColor: colors.mark }}>{item.nome}</Text>
                </Text>
                <Text style={[styles.itemMeta, tabularNums]}>
                  {item.sku} · <Text style={tabularNums}>{item.quantidadeTotal ?? 0}</Text> un.
                </Text>
              </View>
              <StatusPill state={state} />
            </TouchableOpacity>
            </RowIn>
          );
        }}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.success} {...decorative} />
              <Text style={styles.emptyText}>Tudo em ordem. Nenhum produto precisa de atenção agora.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  header: { backgroundColor: colors.headerBg, paddingVertical: 14, paddingHorizontal: 16, elevation: 4 },
  headerText: { fontFamily: fonts.heading, color: colors.headerInk, fontSize: 22 },
  greeting: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 14, marginTop: 18 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.text, marginTop: 26, marginBottom: 4 },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text },
  itemMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMutedLight, textAlign: 'center', maxWidth: 240 },
  errorText: { fontFamily: fonts.sans, color: colors.error, marginTop: 20, textAlign: 'center' },
});

export default HomeScreen;
