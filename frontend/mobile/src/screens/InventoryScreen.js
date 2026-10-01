import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Button, Searchbar, Chip } from 'react-native-paper';
import BrandFilterSheet from '../components/BrandFilterSheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import { useRoute } from '@react-navigation/native';
import { useNavigate } from '../hooks/useNavigate';
import SkeletonList from '../components/SkeletonList';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { useDockClearance } from '../components/BottomTabBar';
import ProductRow from '../components/ProductRow';
import RemoveStockModal from '../components/RemoveStockModal';
import { useToast } from '../components/Toast';
import { submitStockWithdrawal } from '../services/stockMutations';
import { STOCK_FILTERS, filterStock } from '../utils/stock';
import { decorative, slopFor } from '../utils/a11y';
import { LIST_PERF_PROPS } from '../utils/listPerf';

const keyExtractor = (item) => item.id.toString();

// Tela 02 — Estoque. Search + status chips (Todos/Baixo/Sem estoque, per spec)
// plus a secondary marca filter in a bottom sheet (existing pattern, kept).
const InventoryScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const dockClearance = useDockClearance();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounce = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Todos');

  // The cards on Hoje open this tab already filtered ({ status } param, a new object per tap).
  const { params } = useRoute();
  useEffect(() => {
    if (!params?.status) return;
    setStatusFilter(params.status);
    setSelectedMarca(null);
  }, [params]);

  // Every keystroke used to refetch immediately, wiping the whole screen with
  // a full-screen spinner each time (see useFetchProducts) - debounce so
  // typing doesn't fire a request, and a flash, per character.
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]);

  const { data: produtos, isLoading, error, refetch, mutate } = useFetchProducts({ search: debouncedSearch });
  const navigate = useNavigate();
  const showToast = useToast();
  const [removingProduct, setRemovingProduct] = useState(null);

  const bottomSheetRef = useRef(null);
  const openFilters = useCallback(() => bottomSheetRef.current?.expand(), []);

  // Stable handlers + renderItem: with the memoized ProductRow, only rows whose
  // data changed re-render (not all of them on every keystroke or modal toggle).
  const openProduct = useCallback((p) => navigate('ProductDetail', { productId: p.id }), [navigate]);
  const receiveProduct = useCallback((p) => navigate('EntradaRomaneio', { produtoId: p.id }), [navigate]);
  const renderItem = useCallback(
    ({ item }) => (
      <ProductRow item={item} onPress={openProduct} onReceive={receiveProduct} onRequestRemove={setRemovingProduct} />
    ),
    [openProduct, receiveProduct]
  );

  const ativos = useMemo(() => (produtos || []).filter((p) => p.active !== false), [produtos]);

  const marcas = useMemo(() => {
    const nomes = ativos.map((p) => p.linha?.marca?.nome).filter(Boolean);
    return [...new Set(nomes)];
  }, [ativos]);

  const produtosFiltrados = useMemo(
    () => filterStock(ativos, { marca: selectedMarca, status: statusFilter }),
    [ativos, selectedMarca, statusFilter]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  // Optimistic: the list shows the new quantity and the modal closes right away
  // (the server round trip is ~300ms+); if the server refuses or the call fails,
  // the previous list is restored and the reason is shown.
  const handleConfirmRemove = async (quantidade, motivo) => {
    if (!removingProduct) return;
    const product = removingProduct;
    const previous = produtos;
    mutate((list) =>
      list?.map((p) =>
        p.id === product.id ? { ...p, quantidadeTotal: Math.max(0, (p.quantidadeTotal ?? 0) - quantidade) } : p
      )
    );
    setRemovingProduct(null);
    try {
      const outcome = await submitStockWithdrawal({ produtoId: product.id, quantidade, motivo }, product);
      if (outcome.queued) {
        showToast(`Sem conexão — ${product.nome} será sincronizado ao reconectar`);
      } else if (outcome.result.sucesso) {
        showToast(`${product.nome} · -${quantidade} unidade${quantidade === 1 ? '' : 's'}`);
        refetch(); // background revalidation with the real numbers
      } else {
        mutate(() => previous);
        showToast(outcome.result.mensagem || 'Estoque insuficiente');
      }
    } catch (e) {
      mutate(() => previous);
      showToast(e.message || 'Erro ao remover estoque');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SkeletonList rows={9} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.text }}>{error.message}</Text>
        <Button mode="contained" onPress={handleRefresh}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topHeader}>
        <Text style={styles.eyebrow}>ESTOQUE</Text>
        <View style={styles.topHeaderRow}>
          <Text style={styles.title} accessibilityRole="header">Estoque</Text>
          <TouchableOpacity
            onPress={() => navigate('AddEditProduct')}
            style={styles.addBtn}
            hitSlop={slopFor(32)}
            accessibilityRole="button"
            accessibilityLabel="Adicionar produto"
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.headerInk} {...decorative} />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Buscar por nome, SKU, marca ou linha..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          icon="magnify"
          accessibilityLabel="Buscar produtos"
          clearAccessibilityLabel="Limpar busca"
          searchAccessibilityLabel="Buscar"
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilters}
          hitSlop={slopFor(40)}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por marca"
          accessibilityHint="Abre a lista de marcas"
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={colors.primary} {...decorative} />
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        {STOCK_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[styles.statusChip, statusFilter === f.value && styles.statusChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Mostrar ${f.label}`}
            accessibilityState={{ selected: statusFilter === f.value }}
          >
            <Text style={[styles.statusChipText, statusFilter === f.value && styles.statusChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedMarca && (
        <View style={styles.activeFilterRow}>
          <Chip icon="tag" onClose={() => setSelectedMarca(null)} closeIconAccessibilityLabel="Remover filtro de marca">{selectedMarca}</Chip>
        </View>
      )}

      <FlatList
        data={produtosFiltrados}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: dockClearance }}
        {...LIST_PERF_PROPS}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={48} color={colors.disabled} {...decorative} />
            <Text style={{ marginTop: 16, color: colors.textMuted }}>
              Nenhum produto encontrado
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ padding: 20 }}>
            <Text style={{ textAlign: 'center', color: colors.disabled }}>
              <Text style={tabularNums}>{produtosFiltrados?.length ?? 0}</Text> produtos encontrados
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Bottom Sheet with visual Chips for dynamic filters (por Marca) */}
      <BrandFilterSheet sheetRef={bottomSheetRef} marcas={marcas} selected={selectedMarca} onSelect={setSelectedMarca} />

      <RemoveStockModal
        visible={!!removingProduct}
        product={removingProduct}
        onClose={() => setRemovingProduct(null)}
        onConfirm={handleConfirmRemove}
        busy={false}
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  topHeader: {
    backgroundColor: colors.headerBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.headerInk,
    opacity: 0.65,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.headerInk,
    fontSize: 22,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.headerLine,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.headerInk,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  filterButton: {
    padding: 10,
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  statusChipTextActive: {
    color: colors.primaryLight,
  },
  activeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});

export default InventoryScreen;
