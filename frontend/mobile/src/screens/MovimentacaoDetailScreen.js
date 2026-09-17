import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Button, Card, Title, Paragraph, Caption } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';
import { colors, tabularNums } from '../theme/colors';

const MovimentacaoDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const { produtoId } = route.params || {};

  // The backend has no movement-history endpoint yet (no "Movimentacao" entity/table),
  // so this stays example data until that's built server-side. See HistoryScreen for
  // the same limitation noted in its empty state.
  const movimentacoes = [
    {
      id: 1,
      tipo: 'ENTRADA',
      quantidade: 50,
      unidade: 'unidade',
      numeroLote: 'LOTE-001',
      dataHora: '2024-01-15T10:30:00',
      produtoNome: 'Produto Exemplo',
      sku: 'EXEMPLO-001',
    },
    {
      id: 2,
      tipo: 'SAIDA',
      quantidade: 10,
      unidade: 'unidade',
      numeroLote: 'LOTE-001',
      dataHora: '2024-01-20T15:45:00',
      produtoNome: 'Produto Exemplo',
      sku: 'EXEMPLO-001',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: colors.primary, paddingVertical: 20, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
          Movimentações do Produto
        </Text>
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        <Card elevation={3} style={{ flex: 1 }}>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>Histórico de Movimentações</Title>
            <Paragraph style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>
              Dados de exemplo — o backend ainda não expõe histórico real de movimentações.
            </Paragraph>

            <FlatList
              data={movimentacoes}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={{ padding: 12, borderBottomWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name={item.tipo === 'ENTRADA' ? 'arrow-up-bold' : 'arrow-down-bold'}
                      size={24}
                      color={item.tipo === 'ENTRADA' ? colors.success : colors.error}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Title>{item.produtoNome}</Title>
                      <Caption style={tabularNums}>{item.sku}</Caption>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text>
                          <Text style={{ fontWeight: '700' }}>
                            {item.tipo === 'ENTRADA' ? 'Entrada: ' : 'Saída: '}
                          </Text>
                          <Text style={tabularNums}>{item.quantidade} {item.unidade}</Text>
                        </Text>
                        <Text>
                          <Text style={{ fontWeight: '700' }}>Lote: </Text>
                          <Text style={tabularNums}>{item.numeroLote}</Text>
                        </Text>
                      </View>
                      <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                        {new Date(item.dataHora).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="history" size={48} color={colors.disabled} />
                  <Text style={{ marginTop: 16, color: colors.textMuted }}>
                    Nenhuma movimentação encontrada
                  </Text>
                </View>
              }
            />
          </View>
        </Card>
      </View>

      <View style={{ padding: 16 }}>
        <Button mode="outlined" onPress={() => navigate.goBack()}>
          Voltar
        </Button>
      </View>
    </View>
  );
};

export default MovimentacaoDetailScreen;
