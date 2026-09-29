import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiService from '../services/api';
import { useNavigate } from '../hooks/useNavigate';
import { colors, fonts, tabularNums } from '../theme/colors';

const STATUS_TONE = {
  PENDENTE: { bg: colors.warningBg, ink: colors.warningInk, label: 'Pendente' },
  CONFIRMADO: { bg: colors.successBg, ink: colors.successInk, label: 'Confirmado' },
  ENVIADO: { bg: colors.neutralBg, ink: colors.neutralInk, label: 'Enviado' },
  ENTREGUE: { bg: colors.successBg, ink: colors.successInk, label: 'Entregue' },
  CANCELADO: { bg: colors.neutralBg, ink: colors.neutralInk, label: 'Cancelado' },
};

const STATUS_FILTERS = [
  { value: null, label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ENTREGUE', label: 'Entregue' },
];

// Tela de Pedidos — mirrors InventoryScreen's search/status-chip/list pattern.
const OrdersScreen = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  // Only block the list with a spinner on the very first load - switching
  // status filters afterward keeps the last list visible while it refetches.
  const load = () => {
    if (!hasLoadedOnce.current) setIsLoading(true);
    apiService
      .getPedidos(status ? { status } : {})
      .then((r) => {
        setPedidos(r.content || []);
        setError(null);
      })
      .catch(setError)
      .finally(() => {
        setIsLoading(false);
        hasLoadedOnce.current = true;
      });
  };

  useEffect(load, [status]);

  const handleRefresh = () => {
    setRefreshing(true);
    apiService
      .getPedidos(status ? { status } : {})
      .then((r) => setPedidos(r.content || []))
      .catch(setError)
      .finally(() => setRefreshing(false));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topHeader}>
        <Text style={styles.eyebrow}>PEDIDOS</Text>
        <View style={styles.topHeaderRow}>
          <Text style={styles.title}>Pedidos</Text>
          <TouchableOpacity onPress={() => navigate('AddEditPedido')} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.primaryLight} />
            <Text style={styles.addBtnText}>Novo pedido</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            onPress={() => setStatus(f.value)}
            style={[styles.statusChip, status === f.value && styles.statusChipActive]}
          >
            <Text style={[styles.statusChipText, status === f.value && styles.statusChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.error }}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => {
            const tone = STATUS_TONE[item.status] || STATUS_TONE.PENDENTE;
            return (
              <TouchableOpacity style={styles.row} onPress={() => navigate('PedidoDetail', { pedidoId: item.id })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clienteName}>{item.cliente?.nome}</Text>
                  <Text style={[styles.meta, tabularNums]}>
                    {item.itens?.length || 0} item(ns) · R$ {(item.valorTotal ?? 0).toFixed(2)}
                  </Text>
                  <Text style={styles.date}>
                    {item.dataCriacao ? new Date(item.dataCriacao).toLocaleDateString('pt-BR') : ''}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.statusPillText, { color: tone.ink }]}>{tone.label}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.disabled} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.disabled} />
              <Text style={{ marginTop: 16, color: colors.textMuted, textAlign: 'center' }}>
                Nenhum pedido encontrado
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primaryLight,
    opacity: 0.65,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.primaryLight,
    fontSize: 22,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(248,242,234,0.3)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.primaryLight,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  statusChipTextActive: {
    color: colors.primaryLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  clienteName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusPillText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

export default OrdersScreen;
