import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput as RNTextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Title, Caption } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import apiService from '../services/api';
import { useNavigate } from '../hooks/useNavigate';
import { colors, tabularNums } from '../theme/colors';

/**
 * "Entrada de Romaneio (Sem Câmera)" — the mobile app's headline stock-entry flow:
 * type the box's lot number once, then repeatedly search a product by Linha/Marca,
 * confirm it, key in the quantity on the numeric keypad only, and add it to the running
 * totalizer at the bottom. "Finalizar" ends the session once every box item is logged.
 */
const EntradaRomaneioScreen = () => {
  const navigate = useNavigate();
  const route = useRoute();

  const [numeroLote, setNumeroLote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [itensLidos, setItensLidos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const debounceRef = useRef(null);

  // Autocomplete by Linha/Marca (and name/SKU) — debounced 300ms per the design spec.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await apiService.getProducts({ search: searchTerm.trim() });
        setSearchResults((results || []).slice(0, 10));
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  useEffect(() => {
    if (route.params?.produtoId) {
      apiService.getProductById(route.params.produtoId).then(setProdutoSelecionado).catch(() => {});
    }
  }, [route.params?.produtoId]);

  const selecionarProduto = (produto) => {
    setProdutoSelecionado(produto);
    setPrecoCusto(produto.precoCusto != null ? String(produto.precoCusto) : '');
    setSearchTerm('');
    setSearchResults([]);
  };

  const totalItensLidos = itensLidos.reduce((sum, item) => sum + item.quantidade, 0);

  const limparItemAtual = () => {
    setProdutoSelecionado(null);
    setQuantidade('');
    setDataValidade('');
    setPrecoCusto('');
  };

  const adicionarItem = async () => {
    setErrorMsg(null);

    if (!numeroLote.trim()) {
      setErrorMsg('Digite o número do lote da caixa.');
      return;
    }
    if (!produtoSelecionado) {
      setErrorMsg('Selecione um produto na busca.');
      return;
    }
    const quantidadeNum = parseInt(quantidade, 10);
    if (!quantidadeNum || quantidadeNum <= 0) {
      setErrorMsg('Digite uma quantidade válida.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataValidade)) {
      setErrorMsg('Digite a data de validade no formato AAAA-MM-DD.');
      return;
    }
    const precoCustoNum = parseFloat(precoCusto);
    if (!precoCustoNum || precoCustoNum <= 0) {
      setErrorMsg('Digite um preço de custo válido.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createStockEntry({
        produtoId: produtoSelecionado.id,
        numeroLote: numeroLote.trim(),
        quantidade: quantidadeNum,
        dataValidade,
        precoCusto: precoCustoNum,
      });

      setItensLidos((prev) => [
        ...prev,
        {
          key: `${produtoSelecionado.id}-${Date.now()}`,
          produtoNome: produtoSelecionado.nome,
          sku: produtoSelecionado.sku,
          quantidade: quantidadeNum,
        },
      ]);
      limparItemAtual();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao registrar entrada de estoque.');
    } finally {
      setSubmitting(false);
    }
  };

  const finalizar = () => {
    navigate('Home', { screen: 'Inventário' });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate.goBack()} accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Entrada de Romaneio</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        data={[]}
        renderItem={null}
        ListEmptyComponent={
          <View>
            {/* Número do Lote da Caixa */}
            <Text style={styles.label}>Número do Lote da Caixa</Text>
            <RNTextInput
              value={numeroLote}
              onChangeText={setNumeroLote}
              placeholder="Ex: LOTE-2026-0142"
              style={styles.input}
              autoCapitalize="characters"
            />

            {/* Busca rápida com autocomplete por Linha/Marca */}
            {!produtoSelecionado && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Buscar Produto (nome, SKU, marca ou linha)</Text>
                <RNTextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Digite para buscar..."
                  style={styles.input}
                />
                {isSearching && <Caption>Buscando...</Caption>}
                {searchResults.map((produto) => (
                  <TouchableOpacity
                    key={produto.id}
                    style={styles.resultRow}
                    onPress={() => selecionarProduto(produto)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600' }}>{produto.nome}</Text>
                      <Caption style={tabularNums}>
                        {produto.sku} · {produto.linha?.marca?.nome} · {produto.linha?.nome}
                      </Caption>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Produto selecionado + quantidade (teclado exclusivamente numérico) */}
            {produtoSelecionado && (
              <View style={styles.selectedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700' }}>{produtoSelecionado.nome}</Text>
                  <Caption style={tabularNums}>{produtoSelecionado.sku}</Caption>
                </View>
                <TouchableOpacity onPress={limparItemAtual} accessibilityLabel="Trocar produto">
                  <MaterialCommunityIcons name="close-circle" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {produtoSelecionado && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Quantidade</Text>
                <RNTextInput
                  value={quantidade}
                  onChangeText={(text) => setQuantidade(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="0"
                  style={[styles.input, styles.quantityInput, tabularNums]}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Data de Validade (AAAA-MM-DD)</Text>
                <RNTextInput
                  value={dataValidade}
                  onChangeText={setDataValidade}
                  keyboardType="numbers-and-punctuation"
                  placeholder="2027-12-31"
                  style={[styles.input, tabularNums]}
                  maxLength={10}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Preço de Custo (R$)</Text>
                <RNTextInput
                  value={precoCusto}
                  onChangeText={(text) => setPrecoCusto(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  style={[styles.input, tabularNums]}
                />

                {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

                <Button
                  mode="contained"
                  onPress={adicionarItem}
                  loading={submitting}
                  disabled={submitting}
                  buttonColor={colors.primary}
                  style={{ marginTop: 16 }}
                >
                  Adicionar Item
                </Button>
              </>
            )}

            {!produtoSelecionado && errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            {/* Session so far */}
            {itensLidos.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Title>Itens desta caixa</Title>
                {itensLidos.map((item) => (
                  <View key={item.key} style={styles.itemRow}>
                    <Text style={{ flex: 1 }}>{item.produtoNome}</Text>
                    <Text style={tabularNums}>{item.quantidade}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        }
      />

      {/* Fixed footer totalizer */}
      <View style={styles.footer}>
        <View>
          <Caption>Itens lidos</Caption>
          <Text style={[styles.totalText, tabularNums]}>
            {itensLidos.length} produtos · {totalItensLidos} unidades
          </Text>
        </View>
        <Button mode="contained" onPress={finalizar} buttonColor={colors.secondary}>
          Finalizar
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  quantityInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    marginTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});

export default EntradaRomaneioScreen;
