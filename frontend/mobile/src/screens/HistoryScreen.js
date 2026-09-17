import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Caption, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchHistory from '../hooks/useFetchHistory';
import { useNavigate } from '../hooks/useNavigate';
import { colors, fonts, tabularNums } from '../theme/colors';
import ReasonMenu from '../components/ReasonMenu';
import apiService from '../services/api';
import { MOTIVO_LABEL } from '../utils/motivos';

const PERIODOS = [
  { value: null, label: 'Tudo' },
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

const toIsoDate = (date) => date.toISOString().slice(0, 10);

// Tela de histórico — tipo (segmentado), produto (busca), operador (se o backend
// permitir — /api/usuarios é admin-only) e período (chips), com paginação por
// rolagem (onEndReached), tudo consumindo o endpoint real de histórico.
const HistoryScreen = () => {
  const [tipo, setTipo] = useState(null); // null | 'ENTRADA' | 'SAIDA'
  const [periodoDias, setPeriodoDias] = useState(null);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoResults, setProdutoResults] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    apiService.getUsuarios().then(setUsuarios).catch(() => setUsuarios([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (produtoSearch.trim().length < 2) {
      setProdutoResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      apiService
        .getProducts({ search: produtoSearch.trim() })
        .then((r) => setProdutoResults((r || []).slice(0, 8)))
        .catch(() => setProdutoResults([]));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [produtoSearch]);

  const filters = useMemo(() => {
    const f = {};
    if (tipo) f.tipo = tipo;
    if (selectedProduto) f.produtoId = selectedProduto.id;
    if (selectedUsuario) f.usuarioId = selectedUsuario.id;
    if (periodoDias) {
      f.dataInicio = toIsoDate(new Date(Date.now() - periodoDias * 86400000));
      f.dataFim = toIsoDate(new Date());
    }
    return f;
  }, [tipo, selectedProduto, selectedUsuario, periodoDias]);

  const { data: movimentacoes, isLoading, isLoadingMore, error, loadMore, hasMore } = useFetchHistory(filters);

  const renderItem = ({ item }) => {
    const isEntrada = item.tipo === 'ENTRADA';
    return (
      <TouchableOpacity
        onPress={() => navigate('MovimentacaoDetail', { movimentacao: item })}
        style={[styles.row, { backgroundColor: isEntrada ? colors.background : colors.surface }]}
      >
        <MaterialCommunityIcons
          name={isEntrada ? 'arrow-up-bold' : 'arrow-down-bold'}
          size={24}
          color={isEntrada ? colors.success : colors.error}
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.produto?.nome}</Text>
          <Caption style={[styles.itemCaption, tabularNums]}>{item.produto?.sku}</Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text>
              <Text style={styles.bold}>{isEntrada ? 'Entrada: ' : 'Saída: '}</Text>
              <Text style={tabularNums}>{item.quantidade}</Text>
            </Text>
            <Text style={styles.motivoText}>{MOTIVO_LABEL[item.motivo] || item.motivo}</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
            {item.dataMovimentacao ? new Date(item.dataMovimentacao).toLocaleString('pt-BR') : ''}
            {item.usuario?.username ? ` · ${item.usuario.username}` : ''}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.segmentedControl}>
        {[
          { key: null, label: 'Todas' },
          { key: 'ENTRADA', label: 'Entradas' },
          { key: 'SAIDA', label: 'Saídas' },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[styles.segment, tipo === option.key && styles.segmentActive]}
            onPress={() => setTipo(option.key)}
          >
            <Text style={[styles.segmentText, tipo === option.key && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filtersBar}>
        <View style={styles.produtoFilterWrap}>
          {selectedProduto ? (
            <View style={styles.produtoChip}>
              <Text style={styles.produtoChipText} numberOfLines={1}>{selectedProduto.nome}</Text>
              <TouchableOpacity onPress={() => { setSelectedProduto(null); setProdutoSearch(''); }}>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                value={produtoSearch}
                onChangeText={setProdutoSearch}
                placeholder="Filtrar por produto..."
                style={styles.produtoInput}
              />
              {produtoResults.length > 0 && (
                <View style={styles.produtoResults}>
                  {produtoResults.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.produtoResultRow}
                      onPress={() => { setSelectedProduto(p); setProdutoResults([]); }}
                    >
                      <Text numberOfLines={1}>{p.nome} · {p.sku}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {usuarios.length > 0 && (
          <ReasonMenu
            options={[{ value: null, label: 'Todos operadores' }, ...usuarios.map((u) => ({ value: u.id, label: u.username }))]}
            onSelect={(id) => setSelectedUsuario(id ? usuarios.find((u) => u.id === id) : null)}
          >
            {({ open }) => (
              <TouchableOpacity onPress={open} style={styles.operadorBtn}>
                <MaterialCommunityIcons name="account-outline" size={14} color={colors.textMuted} />
                <Text style={styles.operadorBtnText} numberOfLines={1}>
                  {selectedUsuario?.username || 'Operador'}
                </Text>
              </TouchableOpacity>
            )}
          </ReasonMenu>
        )}
      </View>

      <View style={styles.periodoRow}>
        {PERIODOS.map((p) => (
          <TouchableOpacity
            key={p.label}
            onPress={() => setPeriodoDias(p.value)}
            style={[styles.periodoChip, periodoDias === p.value && styles.periodoChipActive]}
          >
            <Text style={[styles.periodoChipText, periodoDias === p.value && styles.periodoChipTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.error }}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={movimentacoes || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialCommunityIcons name="history" size={48} color={colors.disabled} />
              <Text style={{ marginTop: 16, color: colors.textMuted, textAlign: 'center' }}>
                Nenhuma movimentação encontrada
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: colors.secondary,
  },
  segmentText: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  produtoFilterWrap: { flex: 1 },
  produtoInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
  },
  produtoResults: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  produtoResultRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  produtoChip: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
  },
  produtoChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  operadorBtn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    maxWidth: 130,
  },
  operadorBtnText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text,
  },
  periodoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  periodoChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  periodoChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodoChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  periodoChipTextActive: {
    color: colors.primaryLight,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.text,
  },
  itemCaption: {
    fontFamily: fonts.mono,
    color: colors.textMutedLight,
  },
  bold: {
    fontFamily: fonts.sansMedium,
  },
  motivoText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
  },
});

export default HistoryScreen;
