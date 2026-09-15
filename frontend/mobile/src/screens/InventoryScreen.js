import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Caption, List, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFetchProducts } from '../hooks/useFetchProducts';
import { useNavigate } from '../hooks/useNavigate';

const InventoryScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { data: produtos, isLoading, error } = useFetchProducts({ search: searchTerm });
  const navigate = useNavigate();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigate('ProductDetail', { productId: item.id })}
      style={{ padding: 12, borderBottomWidth: 1, borderColor: '#EEEEEE' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons
          name="package-variant"
          size={24}
          color="#5B2C6F"
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Title>{item.nome}</Title>
          <Caption>{item.sku}</Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Paragraph>
              <strong>Estoque:</strong> {item.quantidadeTotal ?? 0}
            </Paragraph>
            {item.quantidadeTotal < item.estoqueMinimo && (
              <Text style={{ color: '#E74C3C', fontWeight: '600' }}>
                CRÍTICO
              </Text>
            )}
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#BDC3C7"
        />
      </View>
    </TouchableOpacity>
  );

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
        <Button mode="contained" onPress={() => handleRefresh()}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Buscar produtos..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        icon="magnify"
      />

      <FlatList
        data={produtos || []}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#BDC3C7" />
            <Text style={{ marginTop: 16, color: '#7F8C8D' }}>
              Nenhum produto encontrado
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ padding: 20 }}>
            <Text style={{ textAlign: 'center', color: '#95A5A6' }}>
              {produtos?.length ?? 0} produtos encontrados
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      />
    </View>
  );
};

export default InventoryScreen;