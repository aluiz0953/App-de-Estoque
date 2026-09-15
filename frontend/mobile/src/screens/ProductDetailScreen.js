import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Caption, List, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFetchProductById } from '../hooks/useFetchProductById';
import { useFetchProductLotes } from '../hooks/useFetchProductLotes';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const { productId } = route.params;

  const { data: produto, isLoading: isLoadingProduto, error: errorProduto } = useFetchProductById(productId);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(productId);

  // Calcular margem de lucro se temos o produto
  const margemLucro = produto
    ? ((produto.precoVenda - produto.precoCusto) / produto.precoVenda * 100).toFixed(1)
    : null;

  const marginColor = margemLucro && parseFloat(margemLucro) >= 30
    ? '#2ECC71' // Verde para margem saudável
    : '#E74C3C'; // Vermelho para margem baixa

  if (isLoadingProduto || isLoadingLotes) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B2C6F" />
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
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#5B2C6F', paddingVertical: 20, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
          {produto.nome}
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        <Card elevation={3}>
          <View style={{ padding: 16 }}>
            <Title>Informações do Produto</Title>

            <View style={{ marginVertical: 12 }}>
              <Paragraph><strong>SKU:</strong> {produto.sku}</Paragraph>
              <Paragraph><strong>Descrição:</strong> {produto.descricao || 'Não informada'}</Paragraph>
              <Paragraph>
                <strong>Marca:</strong> {produto.linha?.marca?.nome || 'Não informada'}
              </Paragraph>
              <Paragraph>
                <strong>Linha:</strong> {produto.linha?.nome || 'Não informada'}
              </Paragraph>
            </View>

            <View style={{ marginVertical: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#EEEEEE' }}>
              <Paragraph><strong>Preço de Custo:</strong> R$ {produto.precoCusto?.toFixed(2)}</Paragraph>
              <Paragraph><strong>Preço de Venda:</strong> R$ {produto.precoVenda?.toFixed(2)}</Paragraph>
              <Paragraph style={{ marginTop: 8 }}>
                <strong>Margem de Lucro:</strong>
                <Text style={{ color: marginColor, fontWeight: '600' }}>
                  {margemLucro}%
                </Text>
              </Paragraph>
            </View>
          </View>
        </Card>
      </View>

      <View style={{ padding: 16 }}>
        <Card elevation={3}>
          <View style={{ padding: 16 }}>
            <Title>Lotes em Estoque</Title>

            {lotes && lotes.length > 0 ? (
              <FlatList
                data={lotes}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#EEEEEE' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Paragraph><strong>Lote:</strong> {item.numeroLote}</Paragraph>
                        <Paragraph><strong>Quantidade:</strong> {item.quantidade} {item.unidadeMedida}</Paragraph>
                        <Paragraph><strong>Validade:</strong> {item.dataValidade}</Paragraph>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {item.status === 'ATIVO' && (
                          <Text style={{
                            backgroundColor: '#2ECC71',
                            color: 'white',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            fontSize: 12
                          }}>
                            ATIVO
                          </Text>
                        )}
                        {item.status === 'VENCIDO' && (
                          <Text style={{
                            backgroundColor: '#E74C3C',
                            color: 'white',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            fontSize: 12
                          }}>
                            VENCIDO
                          </Text>
                        )}
                        {item.status === 'RESERVADO' && (
                          <Text style={{
                            backgroundColor: '#F39C12',
                            color: 'white',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            fontSize: 12
                          }}>
                            RESERVADO
                          </Text>
                        )}
                        {item.status === 'BLOQUEADO' && (
                          <Text style={{
                            backgroundColor: '#95A5A6',
                            color: 'white',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            fontSize: 12
                          }}>
                            BLOQUEADO
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="package-variant" size={48} color="#BDC3C7" />
                    <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
                      Nenhum lote encontrado
                    </Text>
                  }
                }
            } : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#BDC3C7" />
                <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
                  Nenhum lote encontrado
                </Text>
              </View>
            )}
          </View>
        </Card>
      </View>

      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button
          mode="outlined"
          onPress={() => navigate('Inventory')}
          style={{ flex: 1, marginRight: 8 }}
        >
          Voltar ao Estoque
        </Button>
        <Button
          mode="contained"
          onPress={() => navigate('MovimentacaoDetail', { produtoId: produto.id })}
          style={{ flex: 1, marginLeft: 8, backgroundColor: '#5B2C6F' }}
        >
          Ver Movimentações
        </Button>
      </View>
    </View>
  );
};

export default ProductDetailScreen;