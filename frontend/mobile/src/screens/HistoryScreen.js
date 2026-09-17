import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Title, Caption, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useFetchHistory from '../hooks/useFetchHistory';
import { useNavigate } from '../hooks/useNavigate';
import { colors, fonts, tabularNums } from '../theme/colors';

const HistoryScreen = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'entrada', 'saida'
  const { data: movimentacoes, isLoading, error } = useFetchHistory(filter);
  const navigate = useNavigate();

  const renderItem = ({ item }) => {
    const isEntrada = item.tipo === 'ENTRADA';
    return (
      <TouchableOpacity
        onPress={() => navigate('MovimentacaoDetail', { movimentacaoId: item.id, produtoId: item.produtoId })}
        style={[styles.row, { backgroundColor: isEntrada ? colors.background : colors.surface }]}
      >
        <MaterialCommunityIcons
          name={isEntrada ? 'arrow-up-bold' : 'arrow-down-bold'}
          size={24}
          color={isEntrada ? colors.success : colors.error}
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Title style={styles.itemTitle}>{item.produtoNome}</Title>
          <Caption style={[styles.itemCaption, tabularNums]}>{item.sku}</Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text>
              <Text style={styles.bold}>{isEntrada ? 'Entrada: ' : 'Saída: '}</Text>
              <Text style={tabularNums}>{item.quantidade} {item.unidade}</Text>
            </Text>
            <Text>
              <Text style={styles.bold}>Lote: </Text>
              <Text style={tabularNums}>{item.numeroLote}</Text>
            </Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
            {new Date(item.dataHora).toLocaleString('pt-BR')}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.segmentedControl}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'entrada', label: 'Entradas' },
          { key: 'saida', label: 'Saídas' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, filter === option.key && styles.segmentActive]}
            onPress={() => setFilter(option.key)}
          >
            <Text style={[styles.segmentText, filter === option.key && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={movimentacoes || []}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="history" size={48} color={colors.disabled} />
            <Text style={{ marginTop: 16, color: colors.textMuted, textAlign: 'center' }}>
              Nenhuma movimentação encontrada
            </Text>
            <Paragraph style={{ marginTop: 8, textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
              O backend ainda não expõe um endpoint de histórico de movimentações — esta tela está
              pronta para consumi-lo assim que ele existir.
            </Paragraph>
          </View>
        }
      />
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
});

export default HistoryScreen;
