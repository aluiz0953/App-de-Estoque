import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Button, Title, Searchbar, Chip } from 'react-native-paper';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import { useNavigate } from '../hooks/useNavigate';
import { colors, fonts, tabularNums } from '../theme/colors';
import ProductRow from '../components/ProductRow';
import RemoveStockModal from '../components/RemoveStockModal';
import { useToast } from '../components/Toast';
import { submitStockWithdrawal } from '../services/stockMutations';
import { getStockState } from '../utils/stock';

const STATUS_FILTERS = [
  { value: 'Todos', label: 'Todos' },
  { value: 'low', label: 'Baixo' },
  { value: 'out', label: 'Sem estoque' },
];

// Tela 02 — Estoque. Search + status chips (Todos/Baixo/Sem estoque, per spec)
// plus a secondary marca filter in a bottom sheet (existing pattern, kept).
const InventoryScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounce = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Every keystroke used to refetch immediately, wiping the whole screen with
  // a full-screen spinner each time (see useFetchProducts) - debounce so
  // typing doesn't fire a request, and a flash, per character.
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]);

  const { data: produtos, isLoading, error, refetch } = useFetchProducts({ search: debouncedSearch });
  const navigate = useNavigate();
  const showToast = useToast();
  const [removingProduct, setRemovingProduct] = useState(null);
  const [removing, setRemoving] = useState(false);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const openFilters = useCallback(() => bottomSheetRef.current?.expand(), []);
  const closeFilters = useCallback(() => bottomSheetRef.current?.close(), []);
  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const ativos = useMemo(() => (produtos || []).filter((p) => p.active !== false), [produtos]);

  const marcas = useMemo(() => {
    const nomes = ativos.map((p) => p.linha?.marca?.nome).filter(Boolean);
    return [...new Set(nomes)];
  }, [ativos]);

  const produtosFiltrados = useMemo(() => {
    return ativos.filter((p) => {
      const matchesMarca = !selectedMarca || p.linha?.marca?.nome === selectedMarca;
      const matchesStatus =
        statusFilter === 'Todos' || getStockState(p.quantidadeTotal, p.estoqueMinimo) === statusFilter;
      return matchesMarca && matchesStatus;
    });
  }, [ativos, selectedMarca, statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleConfirmRemove = async (quantidade, motivo) => {
    if (!removingProduct) return;
    setRemoving(true);
    try {
      const outcome = await submitStockWithdrawal(
        { produtoId: removingProduct.id, quantidade, motivo },
        removingProduct
      );
      if (outcome.queued) {
        showToast(`Sem conexão — ${removingProduct.nome} será sincronizado ao reconectar`);
        setRemovingProduct(null);
      } else if (outcome.result.sucesso) {
        showToast(`${removingProduct.nome} · -${quantidade} unidade${quantidade === 1 ? '' : 's'}`);
        setRemovingProduct(null);
        refetch();
      } else {
        showToast(outcome.result.mensagem || 'Estoque insuficiente');
      }
    } catch (e) {
      showToast(e.message || 'Erro ao remover estoque');
    } finally {
      setRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>{error.message}</Text>
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
          <Text style={styles.title}>Estoque</Text>
          <TouchableOpacity onPress={() => navigate('AddEditProduct')} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.primaryLight} />
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
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={styles.filterButton} onPress={openFilters} accessibilityLabel="Filtros">
          <MaterialCommunityIcons name="filter-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[styles.statusChip, statusFilter === f.value && styles.statusChipActive]}
          >
            <Text style={[styles.statusChipText, statusFilter === f.value && styles.statusChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedMarca && (
        <View style={styles.activeFilterRow}>
          <Chip icon="tag" onClose={() => setSelectedMarca(null)}>{selectedMarca}</Chip>
        </View>
      )}

      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductRow
            item={item}
            onPress={() => navigate('ProductDetail', { productId: item.id })}
            onReceive={(p) => navigate('EntradaRomaneio', { produtoId: p.id })}
            onRequestRemove={setRemovingProduct}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={48} color={colors.disabled} />
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
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={{ padding: 16 }}>
          <Title style={[styles.itemTitle, { marginBottom: 12, fontSize: 18 }]}>Filtrar por Marca</Title>
          <View style={styles.chipRow}>
            <Chip
              selected={!selectedMarca}
              onPress={() => { setSelectedMarca(null); closeFilters(); }}
              style={styles.chip}
            >
              Todas
            </Chip>
            {marcas.map((marca) => (
              <Chip
                key={marca}
                selected={selectedMarca === marca}
                onPress={() => { setSelectedMarca(marca); closeFilters(); }}
                style={styles.chip}
              >
                {marca}
              </Chip>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>

      <RemoveStockModal
        visible={!!removingProduct}
        product={removingProduct}
        onClose={() => setRemovingProduct(null)}
        onConfirm={handleConfirmRemove}
        busy={removing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primaryLight,
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
    color: colors.primaryLight,
    fontSize: 22,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(248,242,234,0.3)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.primaryLight,
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
  itemTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default InventoryScreen;
