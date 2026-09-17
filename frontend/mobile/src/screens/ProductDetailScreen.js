import React from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProductById from '../hooks/useFetchProductById';
import useFetchProductLotes from '../hooks/useFetchProductLotes';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';
import { colors, fonts, tabularNums } from '../theme/colors';

const STATUS_COLORS = {
  ATIVO: colors.success,
  VENCIDO: colors.error,
  RESERVADO: colors.warning,
  BLOQUEADO: colors.disabled,
};

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const { productId } = route.params;

  const { data: produto, isLoading: isLoadingProduto, error: errorProduto } = useFetchProductById(productId);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(productId);

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
        <Text>{errorProduto?.message || errorLotes?.message}</Text>
        <Button mode="contained" onPress={() => navigate.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Produto não encontrado</Text>
        <Button mode="contained" onPress={() => navigate.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.primary, paddingVertical: 20, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: colors.primaryLight, fontSize: 20, fontFamily: fonts.display }}>
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
                  <Title>Informações do Produto</Title>

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
              <Title>Lotes em Estoque</Title>
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
                      backgroundColor: STATUS_COLORS[item.status] || colors.disabled,
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
            <MaterialCommunityIcons name="package-variant" size={48} color={colors.disabled} />
            <Text style={{ marginTop: 16, color: colors.textMuted }}>
              Nenhum lote encontrado
            </Text>
          </View>
        }
      />

      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button
          mode="outlined"
          onPress={() => navigate('Home', { screen: 'Inventário' })}
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
  );
};

export default ProductDetailScreen;
