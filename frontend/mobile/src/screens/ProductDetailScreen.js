import React, { useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProductById from '../hooks/useFetchProductById';
import useFetchProductLotes from '../hooks/useFetchProductLotes';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { decorative } from '../utils/a11y';
import RemoveStockModal from '../components/RemoveStockModal';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { submitStockWithdrawal } from '../services/stockMutations';

const STATUS_COLORS = { ATIVO: 'success', VENCIDO: 'error', RESERVADO: 'warning', BLOQUEADO: 'disabled' };

const ProductDetailScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const route = useRoute();
  const navigate = useNavigate();
  const showToast = useToast();
  const { productId } = route.params;
  const [removing, setRemoving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const { data: produto, isLoading: isLoadingProduto, error: errorProduto, refetch } = useFetchProductById(productId);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(productId);

  const handleConfirmRemove = async (quantidade, motivo) => {
    if (!produto) return;
    setRemoving(true);
    try {
      const outcome = await submitStockWithdrawal({ produtoId: produto.id, quantidade, motivo }, produto);
      if (outcome.queued) {
        showToast(`Sem conexão — ${produto.nome} será sincronizado ao reconectar`);
        setShowRemoveModal(false);
      } else if (outcome.result.sucesso) {
        showToast(`${produto.nome} · -${quantidade} unidade${quantidade === 1 ? '' : 's'}`);
        setShowRemoveModal(false);
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

  const handleArchive = () => {
    if (!produto) return;
    Alert.alert(
      'Arquivar produto',
      `${produto.nome} sairá do inventário ativo, mas o histórico é preservado. Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.archiveProduct(produto.id);
              showToast('Produto arquivado');
              navigate('Home', { screen: 'Estoque' });
            } catch (e) {
              showToast(e.message || 'Erro ao arquivar produto');
            }
          },
        },
      ]
    );
  };

  const margemLucro = produto
    ? ((produto.precoVenda - produto.precoCusto) / produto.precoVenda * 100).toFixed(1)
    : null;

  const marginColor = margemLucro && parseFloat(margemLucro) >= 30
    ? colors.success
    : colors.error;

  if (isLoadingProduto || isLoadingLotes) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorProduto || errorLotes) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.text }}>{errorProduto?.message || errorLotes?.message}</Text>
        <Button mode="contained" onPress={() => navigate.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Produto não encontrado</Text>
        <Button mode="contained" onPress={() => navigate.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.headerBg, paddingVertical: 14, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: colors.headerInk, fontSize: 20, fontFamily: fonts.display }}>
          {produto.nome}
        </Text>
      </View>

      <FlatList
        data={lotes || []}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListHeaderComponent={
          <>
            <View style={{ padding: 16 }}>
              <Card elevation={3}>
                <View style={{ padding: 16 }}>
                  <Title accessibilityRole="header">Informações do Produto</Title>

                  <View style={{ marginVertical: 12 }}>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>SKU: </Text>
                      <Text style={tabularNums}>{produto.sku}</Text>
                    </Paragraph>
                    <Paragraph><Text style={{ fontWeight: '700' }}>Descrição: </Text>{produto.descricao || 'Não informada'}</Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>Marca: </Text>{produto.linha?.marca?.nome || 'Não informada'}
                    </Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>Linha: </Text>{produto.linha?.nome || 'Não informada'}
                    </Paragraph>
                  </View>

                  <View style={{ marginVertical: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border }}>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>Preço de Custo: </Text>
                      <Text style={tabularNums}>R$ {produto.precoCusto?.toFixed(2)}</Text>
                    </Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>Preço de Venda: </Text>
                      <Text style={tabularNums}>R$ {produto.precoVenda?.toFixed(2)}</Text>
                    </Paragraph>
                    <Paragraph style={{ marginTop: 8 }}>
                      <Text style={{ fontWeight: '700' }}>Margem de Lucro: </Text>
                      <Text style={{ color: marginColor, fontWeight: '600' }}>{margemLucro}%</Text>
                    </Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: '700' }}>Estoque Total: </Text>
                      <Text style={tabularNums}>{produto.quantidadeTotal ?? 0}</Text>
                    </Paragraph>
                  </View>
                </View>
              </Card>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              <Title accessibilityRole="header">Lotes em Estoque</Title>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ padding: 12, borderBottomWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Paragraph>
                    <Text style={{ fontWeight: '700' }}>Lote: </Text>
                    <Text style={tabularNums}>{item.numeroLote}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text style={{ fontWeight: '700' }}>Quantidade: </Text>
                    <Text style={tabularNums}>{item.quantidade} {item.unidadeMedida}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text style={{ fontWeight: '700' }}>Validade: </Text>
                    {item.dataValidade}
                  </Paragraph>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      backgroundColor: colors[STATUS_COLORS[item.status] || 'disabled'],
                      color: 'white',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={48} color={colors.disabled} {...decorative} />
            <Text style={{ marginTop: 16, color: colors.textMuted }}>
              Nenhum lote encontrado
            </Text>
          </View>
        }
      />

      <View style={styles.actionBar}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => navigate('EntradaRomaneio', { produtoId: produto.id })}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Receber estoque"
          >
            <MaterialCommunityIcons name="package-down" size={16} color={colors.text} {...decorative} />
            <Text style={styles.actionBtnText}>Receber</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowRemoveModal(true)}
            disabled={(produto.quantidadeTotal ?? 0) <= 0}
            style={[styles.actionBtn, (produto.quantidadeTotal ?? 0) <= 0 && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Remover estoque"
            accessibilityState={{ disabled: (produto.quantidadeTotal ?? 0) <= 0 }}
          >
            <MaterialCommunityIcons name="package-up" size={16} color={colors.text} {...decorative} />
            <Text style={styles.actionBtnText}>Remover</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigate('AddEditProduct', { produtoId: produto.id })}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Editar produto"
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text} {...decorative} />
            <Text style={styles.actionBtnText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleArchive}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Arquivar produto"
            accessibilityHint="Tira o produto das listas; pede confirmação"
          >
            <MaterialCommunityIcons name="archive-outline" size={16} color={colors.error} {...decorative} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Arquivar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Button
            mode="outlined"
            onPress={() => navigate('Home', { screen: 'Estoque' })}
            style={{ flex: 1, marginRight: 8 }}
          >
            Voltar ao Estoque
          </Button>
          <Button
            mode="contained"
            onPress={() => navigate('MovimentacaoDetail', { produtoId: produto.id })}
            buttonColor={colors.primary}
            style={{ flex: 1, marginLeft: 8 }}
          >
            Ver Movimentações
          </Button>
        </View>
      </View>

      <RemoveStockModal
        visible={showRemoveModal}
        product={produto}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleConfirmRemove}
        busy={removing}
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  actionBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.text,
  },
});

export default ProductDetailScreen;
