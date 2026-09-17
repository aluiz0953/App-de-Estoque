import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useNavigate } from '../hooks/useNavigate';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { colors, fonts, tabularNums } from '../theme/colors';

const money = (v) => `R$ ${(v ?? 0).toFixed(2)}`;

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const NEXT_STATUS = { CONFIRMADO: 'ENVIADO', ENVIADO: 'ENTREGUE' };
const NEXT_LABEL = { ENVIADO: 'Marcar como enviado', ENTREGUE: 'Marcar como entregue' };

const PedidoDetailScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const showToast = useToast();
  const { pedidoId } = route.params;

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiService.getPedidoById(pedidoId).then(setPedido).finally(() => setIsLoading(false));
  };

  useEffect(load, [pedidoId]);

  const handleConfirm = () => {
    Alert.alert('Confirmar pedido', 'Isso vai retirar o estoque de cada item do pedido. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setBusy(true);
          try {
            await apiService.confirmPedido(pedidoId);
            showToast('Pedido confirmado');
            load();
          } catch (e) {
            showToast(e.message || 'Erro ao confirmar pedido');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancelar pedido', 'Deseja cancelar este pedido?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await apiService.cancelPedido(pedidoId);
            showToast('Pedido cancelado');
            load();
          } catch (e) {
            showToast(e.message || 'Erro ao cancelar pedido');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleAdvance = async () => {
    const proximo = NEXT_STATUS[pedido.status];
    if (!proximo) return;
    setBusy(true);
    try {
      await apiService.updatePedidoStatus(pedidoId, proximo);
      showToast('Status atualizado');
      load();
    } catch (e) {
      showToast(e.message || 'Erro ao atualizar status');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !pedido) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PEDIDO #{pedido.id}</Text>
        <Text style={styles.headerTitle}>{pedido.cliente?.nome}</Text>
      </View>

      <FlatList
        data={pedido.itens || []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={styles.statusRow}>
            <Text style={styles.statusPill}>{STATUS_LABEL[pedido.status]}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.produto?.nome}</Text>
              <Text style={styles.itemMeta}>{item.produto?.sku}</Text>
            </View>
            <Text style={[styles.itemQty, tabularNums]}>{item.quantidade} × {money(item.precoUnitario)}</Text>
            <Text style={[styles.itemTotal, tabularNums]}>{money(item.precoUnitario * item.quantidade)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, tabularNums]}>{money(pedido.valorTotal)}</Text>
          </View>
        }
      />

      <View style={styles.actionBar}>
        {pedido.status === 'PENDENTE' && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleConfirm} disabled={busy} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Confirmar pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} disabled={busy} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
        {NEXT_STATUS[pedido.status] && (
          <TouchableOpacity onPress={handleAdvance} disabled={busy} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{NEXT_LABEL[NEXT_STATUS[pedido.status]]}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigate.goBack()} style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={styles.backText}>Voltar</Text>
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
  },
  headerEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primaryLight,
    opacity: 0.65,
  },
  headerTitle: {
    fontFamily: fonts.display,
    color: colors.primaryLight,
    fontSize: 22,
    marginTop: 4,
  },
  statusRow: { padding: 16 },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  itemMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  itemQty: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  itemTotal: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text,
    width: 70,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
  },
  totalLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  totalValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.primaryLight,
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.error,
  },
  backText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default PedidoDetailScreen;
