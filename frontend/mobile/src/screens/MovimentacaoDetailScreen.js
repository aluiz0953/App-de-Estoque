import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Caption, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';

const MovimentacaoDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const { produtoId } = route.params;

  // Em uma implementação real, você buscaria as movimentações específicas deste produto
  // Por enquanto, vamos usar um placeholder
  const movimentacoes = [
    {
      id: 1,
      tipo: 'ENTRADA',
      quantidade: 50,
      unidade: 'unidade',
      numeroLote: 'LOTE-001',
      dataHora: '2024-01-15T10:30:00',
      produtoNome: 'Produto Exemplo',
      sku: 'EXEMPLO-001'
    },
    {
      id: 2,
      tipo: 'SAIDA',
      quantidade: 10,
      unidade: 'unidade',
      numeroLote: 'LOTE-001',
      dataHora: '2024-01-20T15:45:00',
      produtoNome: 'Produto Exemplo',
      sku: 'EXEMPLO-001'
    }
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#5B2C6F', paddingVertical: 20, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
          Movimentações do Produto
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        <Card elevation={3}>
          <View style={{ padding: 16 }}>
            <Title>Histórico de Movimentações</Title>

            {movimentacoes && movimentacoes.length > 0 ? (
              <FlatList
                data={movimentacoes}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#EEEEEE' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons
                        name={item.tipo === 'ENTRADA' ? 'arrow-up-bold' : 'arrow-down-bold'}
                        size={24}
                        color={item.tipo === 'ENTRADA' ? '#2ECC71' : '#E74C3C'}
                        style={{ marginRight: 12 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Title>{item.produtoNome}</Title>
                        <Caption>{item.sku}</Caption>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <Paragraph>
                            <strong>{item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}:</strong> {item.quantidade} {item.unidade}
                          </Paragraph>
                          <Paragraph>
                            <strong>Lote:</strong> {item.numeroLote}
                          </Paragraph>
                        </View>
                        <Paragraph style={{ marginTop: 4, fontSize: 12, color: '#7F8C8D' }}>
                          {new Date(item.dataHora).toLocaleString()}
                        </Paragraph>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color="#BDC3C7"
                      />
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="history" size={48} color="#BDC3C7" />
                    <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
                      Nenhuma movimentação encontrada
                    </Text>
                  }
                }
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name="history" size={48} color="#BDC3C7" />
                <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
                  Nenhuma movimentação encontrada
                </Text>
              </View>
            )}
          </View>
        </Card>
      </View>

      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16, justifyContent: 'center' }}>
        <Button
          mode="outlined"
          onPress={() => navigate.goBack()}
        >
          Voltar
        </Button>
      </View>
    </View>
  );
};

export default MovimentacaoDetailScreen;