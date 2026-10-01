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
import MovimentacoesPanel from '../components/MovimentacoesPanel';
import RecentProductsPanel from '../components/RecentProductsPanel';
import QuickActionCard from '../components/QuickActionCard';
import SyncIndicator from '../components/SyncIndicator';
import StatusPill from '../components/StatusPill';
import { getStockState, STOCK_STATE_LABEL } from '../utils/stock';
import { decorative } from '../utils/a11y';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

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
  const alertaTitulo =
    atencao.length === 0
      ? 'Nenhum produto precisa de atenção'
      : `${atencao.length} ${atencao.length === 1 ? 'produto precisa' : 'produtos precisam'} de atenção`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ESTOQUE</Text>
        <Text style={styles.headerText} accessibilityRole="header">Dashboard</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: dockClearance }}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrowGreen}>PAINEL DE CONTROLE</Text>
            <Text style={styles.greeting}>
              Olá{nomeCapitalizado ? `, ${nomeCapitalizado}` : ''}.{' '}
              <Text style={styles.greetingAccent}>
                {atencao.length > 0 ? 'Alguns itens pedem atenção.' : 'Seu estoque está sob controle.'}
              </Text>
            </Text>
            <Text style={styles.subtitle}>Acompanhe produtos, vendas e alertas em um só lugar.</Text>

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

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => navigate('Estoque', { status: 'low' })}
                  accessibilityRole="button"
                  accessibilityLabel={alertaTitulo}
                >
                  <View style={styles.alertIcon} {...decorative}>
                    <MaterialCommunityIcons name="alert-outline" size={20} color={colors.tilePinkInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{alertaTitulo}</Text>
                    <Text style={styles.alertText}>Itens abaixo do estoque mínimo podem afetar suas próximas vendas.</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMutedLight} {...decorative} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle} accessibilityRole="header">Itens que exigem atenção</Text>
              </>
            )}
          </View>
        }
        data={isLoading || error ? [] : atencao}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const state = getStockState(item.quantidadeTotal, item.estoqueMinimo);
          return (
            <TouchableOpacity
              style={styles.attentionRow}
              onPress={() => navigate('ProductDetail', { productId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.nome}, SKU ${item.sku}, ${STOCK_STATE_LABEL[state]}, ${item.quantidadeTotal ?? 0} unidades`}
              accessibilityHint="Toque duas vezes para abrir os detalhes do produto"
            >
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
  header: { backgroundColor: colors.headerBg, paddingVertical: 20, paddingHorizontal: 16, elevation: 4 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: colors.headerInk, opacity: 0.65, marginBottom: 4 },
  headerText: { fontFamily: fonts.display, color: colors.headerInk, fontSize: 22 },
  eyebrowGreen: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.7, color: colors.primary, marginTop: 4 },
  greeting: { fontFamily: fonts.display, fontSize: 25, lineHeight: 31, color: colors.text, marginTop: 8 },
  greetingAccent: { color: colors.secondaryDark, fontStyle: 'italic' },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 6 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  alertCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.roseBg,
  },
  alertIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.tilePinkBg, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.roseInk },
  alertText: { fontFamily: fonts.sans, fontSize: 11, color: colors.roseSoft, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.text, marginTop: 26, marginBottom: 4 },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.text },
  itemMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMutedLight, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMutedLight, textAlign: 'center', maxWidth: 240 },
  errorText: { fontFamily: fonts.sans, color: colors.error, marginTop: 20, textAlign: 'center' },
});

export default HomeScreen;
