import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Caption } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFetchProducts } from '../hooks/useFetchProducts';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';

const HomeScreen = () => {
  const [tab, setTab] = useState('fisico'); // 'fisico' or 'financeiro'
  const { data: produtos, isLoading, error } = useFetchProducts();
  const { data: resumo, isLoading: isLoadingResumo } = useFetchEstoqueResumo();

  const renderFisicoTab = () => {
    if (isLoading) return <ActivityIndicator style={{ margin: 20 }} />;
    if (error) return <Text>{error.message}</Text>;

    // Products with low stock or expiring soon
    const produtosCriticos = produtos?.filter(p =>
      p.quantidadeTotal < p.estoqueMinimo ||
      p.quantidadeVencendoProximos > 0 ||
      p.quantidadeVencida > 0
    ) || [];

    return (
      <View style={{ padding: 16 }}>
        <Title style={{ marginBottom: 16 }}>Estoque Crítico e Vencimentos</Title>

        {produtosCriticos.length === 0 ? (
          <Paragraph>Não há produtos com estoque crítico ou vencimentos próximos.</Paragraph>
        ) : (
          <FlatList
            data={produtosCriticos}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 12, elevation: 3 }}>
                <View style={{ padding: 16 }}>
                  <Title>{item.nome}</Title>
                  <Caption>{item.sku}</Caption>

                  <View style={{ marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Paragraph><strong>Estoque Atual:</strong> {item.quantidadeTotal}</Paragraph>
                      <Paragraph><strong>Estoque Mínimo:</strong> {item.estoqueMinimo}</Paragraph>
                    </View>
                    <View>
                      {item.quantidadeVencida > 0 && (
                        <Paragraph style={{ color: '#E74C3C' }}>
                          <strong>Vencido:</strong> {item.quantidadeVencida}
                        </Paragraph>
                      )}
                      {item.quantidadeVencendoProximos > 0 && (
                        <Paragraph style={{ color: '#F39C12' }}>
                          <strong>Vencendo (30d):</strong> {item.quantidadeVencendoProximos}
                        </Paragraph>
                      )}
                    </View>
                  </View>

                  {item.quantidadeTotal < p.estoqueMinimo && (
                    <Paragraph style={{ color: '#E74C3C', marginTop: 8 }}>
                      <strong>ESTOQUE CRÍTICO</strong>
                    </Paragraph>
                  )}
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <Paragraph>Não há produtos com estoque crítico ou vencimentos próximos.</Paragraph>
            }
          />
        )}
      </View>
    );
  };

  const renderFinanceiroTab = () => {
    if (isLoadingResumo) return <ActivityIndicator style={{ margin: 20 }} />;

    return (
      <View style={{ padding: 16 }}>
        <Title style={{ marginBottom: 16 }}>Capital Empatado no Estoque</Title>

        {resumo ? (
          <View>
            <Card style={{ marginBottom: 16, elevation: 3 }}>
              <View style={{ padding: 16 }}>
                <Title>Resumo Financeiro</Title>
                <Paragraph><strong>Valor Total em Estoque:</strong> R$ {resumo.valorTotalEstoque?.toFixed(2) ?? '0,00'}</Paragraph>
                <Paragraph><strong>Lucro Potencial:</strong> R$ {resumo.lucroPotencial?.toFixed(2) ?? '0,00'}</Paragraph>
                <Paragraph><strong>Número de Produtos:</strong> {resumo.totalProdutos ?? 0}</Paragraph>
                <Paragraph><strong>Número de Lotes Ativos:</strong> {resumo.totalLotesAtivos ?? 0}</Paragraph>
              </View>
            </Card>

            {/* TODO: Add charts/graphs here for visual representation */}
            <Paragraph>Próximamente: Gráficos de distribuição por marca/linha e evolução do capital investido.</Paragraph>
          </View>
        ) : (
          <Paragraph>Carregando dados financeiros...</Paragraph>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#5B2C6F',
        paddingVertical: 20,
        paddingHorizontal: 16,
        elevation: 4
      }}>
        <Text style={{
          color: 'white',
          fontSize: 20,
          fontWeight: '600'
        }}>
          Dashboard de Estoque
        </Text>
      </View>

      {/* Tab Selector */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderColor: '#EEEEEE'
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: tab === 'fisico' ? '#D4AF37' : 'transparent'
          }}
          onPress={() => setTab('fisico')}
        >
          <Text style={{
            color: tab === 'fisico' ? 'white' : '#2C3E50',
            fontWeight: '600'
          }}>
            Físico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: tab === 'financeiro' ? '#D4AF37' : 'transparent'
          }}
          onPress={() => setTab('financeiro')}
        >
          <Text style={{
            color: tab === 'financeiro' ? 'white' : '#2C3E50',
            fontWeight: '600'
          }}>
            Financeiro
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {tab === 'fisico' ? renderFisicoTab() : renderFinanceiroTab()}
      </View>

      {/* FAB for Quick Action */}
      <View style={{
        position: 'absolute',
        bottom: 24,
        right: 24
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#5B2C6F',
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;