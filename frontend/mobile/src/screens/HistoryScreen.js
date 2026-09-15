import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Caption, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFetchHistory } from '../hooks/useFetchHistory';
import { useNavigate } from '../hooks/useNavigate';

const HistoryScreen = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'entrada', 'saida'
  const { data: movimentacoes, isLoading, error } = useFetchHistory(filter);
  const navigate = useNavigate();

  const renderItem = ({ item }) => {
    const isEntrada = item.tipo === 'ENTRADA';
    return (
      <TouchableOpacity
        onPress={() => navigate('MovimentacaoDetail', { movimentacaoId: item.id })}
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderColor: '#EEEEEE',
          backgroundColor: isEntrada ? '#F8F9FA' : 'white'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name={isEntrada ? 'arrow-up-bold' : 'arrow-down-bold'}
            size={24}
            color={isEntrada ? '#2ECC71' : '#E74C3C'}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Title>{item.produtoNome}</Title>
            <Caption>{item.sku}</Caption>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Paragraph>
                <strong>{isEntrada ? 'Entrada' : 'Saída'}:</strong> {item.quantidade} {item.unidade}
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
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B2C6F" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>{error.message}</Text>
        <Button mode="contained" onPress={() => setFilter('all')}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
            backgroundColor: filter === 'all' ? '#D4AF37' : 'transparent'
          }}
          onPress={() => setFilter('all')}
        >
          <Text style={{
            color: filter === 'all' ? 'white' : '#2C3E50',
            fontWeight: '600'
          }}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: filter === 'entrada' ? '#D4AF37' : 'transparent'
          }}
          onPress={() => setFilter('entrada')}
        >
          <Text style={{
            color: filter === 'entrada' ? 'white' : '#2C3E50',
            fontWeight: '600'
          }}>
            Entradas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: filter === 'saida' ? '#D4AF37' : 'transparent'
          }}
          onPress={() => setFilter('saida')}
        >
          <Text style={{
            color: filter === 'saida' ? 'white' : '#2C3E50',
            fontWeight: '600'
          }}>
            Saídas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movimentacoes || []}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="history" size={48} color="#BDC3C7" />
            <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
              Nenhuma movimentação encontrada
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default HistoryScreen;