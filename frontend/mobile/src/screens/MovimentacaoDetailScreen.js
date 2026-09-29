import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Button, Card, Title, Paragraph, Caption } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { useRoute } from '@react-navigation/native';
import apiService from '../services/api';
import { colors, fonts, tabularNums } from '../theme/colors';
import { MOTIVO_LABEL } from '../utils/motivos';

const Row = ({ item }) => (
  <View style={{ padding: 12, borderBottomWidth: 1, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MaterialCommunityIcons
        name={item.tipo === 'ENTRADA' ? 'arrow-up-bold' : 'arrow-down-bold'}
        size={24}
        color={item.tipo === 'ENTRADA' ? colors.success : colors.error}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Title>{item.produto?.nome}</Title>
        <Caption style={tabularNums}>{item.produto?.sku}</Caption>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text>
            <Text style={{ fontWeight: '700' }}>{item.tipo === 'ENTRADA' ? 'Entrada: ' : 'Saída: '}</Text>
            <Text style={tabularNums}>{item.quantidade}</Text>
          </Text>
          <Text>
            <Text style={{ fontWeight: '700' }}>Motivo: </Text>
            {MOTIVO_LABEL[item.motivo] || item.motivo || '—'}
          </Text>
        </View>
        <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
          {item.dataMovimentacao ? new Date(item.dataMovimentacao).toLocaleString('pt-BR') : ''}
          {item.usuario?.username ? ` · ${item.usuario.username}` : ''}
        </Text>
      </View>
    </View>
  </View>
);

// Two call sites: ProductDetailScreen's "Ver Movimentações" passes only
// produtoId (show every movement for that product); HistoryScreen's row tap
// passes the full movimentacao object it already has (show just that one).
const MovimentacaoDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const { produtoId, movimentacao } = route.params || {};

  const [items, setItems] = useState(movimentacao ? [movimentacao] : []);
  const [isLoading, setIsLoading] = useState(!movimentacao && Boolean(produtoId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (movimentacao || !produtoId) return;
    setIsLoading(true);
    apiService
      .getMovimentacoesHistorico({ produtoId, size: 50 })
      .then((result) => setItems(result.content || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [produtoId, movimentacao]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.primary, paddingVertical: 20, paddingHorizontal: 16, elevation: 4 }}>
        <Text style={{ color: colors.primaryLight, fontSize: 20, fontFamily: fonts.display }}>
          {movimentacao ? 'Detalhe da Movimentação' : 'Movimentações do Produto'}
        </Text>
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        <Card elevation={3} style={{ flex: 1 }}>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>Histórico de Movimentações</Title>

            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
            ) : error ? (
              <Paragraph style={{ color: colors.error, marginTop: 8 }}>{error.message}</Paragraph>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Row item={item} />}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="history" size={48} color={colors.disabled} />
                    <Text style={{ marginTop: 16, color: colors.textMuted }}>Nenhuma movimentação encontrada</Text>
                  </View>
                }
              />
            )}
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
