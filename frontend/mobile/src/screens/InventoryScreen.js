import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Button, Title, Caption, Searchbar, Chip } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import { useNavigate } from '../hooks/useNavigate';
import { colors, tabularNums } from '../theme/colors';

const InventoryScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const { data: produtos, isLoading, error, refetch } = useFetchProducts({ search: searchTerm });
  const navigate = useNavigate();

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const openFilters = useCallback(() => bottomSheetRef.current?.expand(), []);
  const closeFilters = useCallback(() => bottomSheetRef.current?.close(), []);
  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const marcas = useMemo(() => {
    const nomes = (produtos || [])
      .map(p => p.linha?.marca?.nome)
      .filter(Boolean);
    return [...new Set(nomes)];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    if (!selectedMarca) return produtos || [];
    return (produtos || []).filter(p => p.linha?.marca?.nome === selectedMarca);
  }, [produtos, selectedMarca]);

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const renderRightActions = (item) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeButton, { backgroundColor: colors.primary }]}
        onPress={() => navigate('ProductDetail', { productId: item.id })}
      >
        <MaterialCommunityIcons name="eye" size={22} color="white" />
        <Text style={styles.swipeButtonText}>Detalhes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeButton, { backgroundColor: colors.secondary }]}
        onPress={() => navigate('EntradaRomaneio', { produtoId: item.id })}
      >
        <MaterialCommunityIcons name="plus-box" size={22} color="white" />
        <Text style={styles.swipeButtonText}>Entrada</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        onPress={() => navigate('ProductDetail', { productId: item.id })}
        style={styles.row}
      >
        <MaterialCommunityIcons
          name="package-variant"
          size={24}
          color={colors.primary}
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Title>{item.nome}</Title>
          <Caption style={tabularNums}>{item.sku}</Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text>
              <Text style={styles.bold}>Estoque: </Text>
              <Text style={tabularNums}>{item.quantidadeTotal ?? 0}</Text>
            </Text>
            {item.quantidadeTotal < item.estoqueMinimo && (
              <Text style={{ color: colors.error, fontWeight: '600' }}>CRÍTICO</Text>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
      </TouchableOpacity>
    </Swipeable>
  );

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
    <View style={{ flex: 1 }}>
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

      {selectedMarca && (
        <View style={styles.activeFilterRow}>
          <Chip icon="tag" onClose={() => setSelectedMarca(null)}>{selectedMarca}</Chip>
        </View>
      )}

      <FlatList
        data={produtosFiltrados}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
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
          <Title style={{ marginBottom: 12 }}>Filtrar por Marca</Title>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
  activeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  swipeActions: {
    flexDirection: 'row',
  },
  swipeButton: {
    width: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
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
