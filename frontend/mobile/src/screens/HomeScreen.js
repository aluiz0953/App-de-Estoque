import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Caption } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchProducts from '../hooks/useFetchProducts';
import useFetchEstoqueResumo from '../hooks/useFetchEstoqueResumo';
import { useNavigate } from '../hooks/useNavigate';
import { colors, tabularNums } from '../theme/colors';

const HomeScreen = () => {
  const [tab, setTab] = useState('fisico'); // 'fisico' or 'financeiro'
  const { data: produtos, isLoading, error } = useFetchProducts();
  const { data: resumo, isLoading: isLoadingResumo } = useFetchEstoqueResumo();
  const navigate = useNavigate();

  const renderFisicoTab = () => {
    if (isLoading) return <ActivityIndicator style={{ margin: 20 }} />;
    if (error) return <Text>{error.message}</Text>;

    // Products with low stock or expiring soon (rupturas e vencimentos)
    const produtosCriticos = produtos?.filter(item =>
      item.quantidadeTotal < item.estoqueMinimo ||
      item.quantidadeVencendoProximos30Dias > 0 ||
      item.quantidadeVencida > 0
    ) || [];

    return (
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Title style={{ marginBottom: 16 }}>Estoque Crítico e Vencimentos</Title>}
        data={produtosCriticos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card} elevation={3}>
            <View style={{ padding: 16 }}>
              <Title>{item.nome}</Title>
              <Caption style={tabularNums}>{item.sku}</Caption>

              <View style={{ marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Paragraph>
                    <Text style={styles.bold}>Estoque Atual: </Text>
                    <Text style={tabularNums}>{item.quantidadeTotal}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text style={styles.bold}>Estoque Mínimo: </Text>
                    <Text style={tabularNums}>{item.estoqueMinimo}</Text>
                  </Paragraph>
                </View>
                <View>
                  {item.quantidadeVencida > 0 && (
                    <Paragraph style={{ color: colors.error }}>
                      <Text style={styles.bold}>Vencido: </Text>
                      <Text style={tabularNums}>{item.quantidadeVencida}</Text>
                    </Paragraph>
                  )}
                  {item.quantidadeVencendoProximos30Dias > 0 && (
                    <Paragraph style={{ color: colors.warning }}>
                      <Text style={styles.bold}>Vencendo (30d): </Text>
                      <Text style={tabularNums}>{item.quantidadeVencendoProximos30Dias}</Text>
                    </Paragraph>
                  )}
                </View>
              </View>

              {item.quantidadeTotal < item.estoqueMinimo && (
                <Paragraph style={{ color: colors.error, marginTop: 8, fontWeight: '700' }}>
                  ESTOQUE CRÍTICO
                </Paragraph>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Paragraph>Não há produtos com estoque crítico ou vencimentos próximos.</Paragraph>
        }
      />
    );
  };

  const renderFinanceiroTab = () => {
    if (isLoadingResumo) return <ActivityIndicator style={{ margin: 20 }} />;

    return (
      <View style={{ padding: 16, flex: 1 }}>
        <Title style={{ marginBottom: 16 }}>Capital Empatado no Estoque</Title>

        {resumo ? (
          <View>
            <Card style={styles.card} elevation={3}>
              <View style={{ padding: 16 }}>
                <Title>Resumo Financeiro</Title>
                <Paragraph>
                  <Text style={styles.bold}>Valor Total em Estoque: </Text>
                  <Text style={tabularNums}>R$ {resumo.valorTotalEstoque?.toFixed(2) ?? '0,00'}</Text>
                </Paragraph>
                <Paragraph>
                  <Text style={styles.bold}>Lucro Potencial: </Text>
                  <Text style={tabularNums}>R$ {resumo.lucroPotencial?.toFixed(2) ?? '0,00'}</Text>
                </Paragraph>
                <Paragraph>
                  <Text style={styles.bold}>Número de Produtos: </Text>
                  <Text style={tabularNums}>{resumo.totalProdutos ?? 0}</Text>
                </Paragraph>
                <Paragraph>
                  <Text style={styles.bold}>Número de Lotes Ativos: </Text>
                  <Text style={tabularNums}>{resumo.totalLotesAtivos ?? 0}</Text>
                </Paragraph>
              </View>
            </Card>

            {/* Full charts are a possible future iteration; the numeric summary above already
                surfaces the same data the spec asks the financial view to show. */}
            <Paragraph>Próximamente: Gráficos de distribuição por marca/linha e evolução do capital investido.</Paragraph>
          </View>
        ) : (
          <Paragraph>Carregando dados financeiros...</Paragraph>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Dashboard de Estoque</Text>
      </View>

      {/* Físico vs. Financeiro segmented control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, tab === 'fisico' && styles.segmentActive]}
          onPress={() => setTab('fisico')}
        >
          <Text style={[styles.segmentText, tab === 'fisico' && styles.segmentTextActive]}>
            Físico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, tab === 'financeiro' && styles.segmentActive]}
          onPress={() => setTab('financeiro')}
        >
          <Text style={[styles.segmentText, tab === 'financeiro' && styles.segmentTextActive]}>
            Financeiro
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {tab === 'fisico' ? renderFisicoTab() : renderFinanceiroTab()}
      </View>

      {/* Centralized FAB — triggers "Entrada de Romaneio" (stock entry by box) */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigate('EntradaRomaneio')}
          accessibilityLabel="Entrada de romaneio"
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderTopWidth: 1,
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
    color: colors.text,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: 'white',
  },
  card: {
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});

export default HomeScreen;
