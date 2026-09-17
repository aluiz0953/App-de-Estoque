import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts, tabularNums } from '../theme/colors';
import StatusPill from './StatusPill';
import { getStockState } from '../utils/stock';

// "-" opens the parent screen's RemoveStockModal (quantity + motivo picker) —
// removal always needs a reason and the operator may want to remove more than
// one unit, so this can't be a one-tap action. "+" is NOT possible inline at
// all: receiving stock requires a lot number, expiration date and unit cost
// (see /api/estoque/entrada), so it hands off to Entrada de Romaneio
// pre-filled for this product instead of pretending to be a one-tap action.
const ProductRow = ({ item, onPress, onReceive, onRequestRemove }) => {
  const quantidade = item.quantidadeTotal ?? 0;
  const state = getStockState(quantidade, item.estoqueMinimo);

  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.7}>
      <View style={styles.thumb}>
        <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color={colors.textMutedLight} />
      </View>

      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.name} numberOfLines={1}>{item.nome}</Text>
        <Text style={[styles.meta, tabularNums]} numberOfLines={1}>
          {item.linha?.marca?.nome ? `${item.linha.marca.nome} · ` : ''}{item.sku}
        </Text>
        <StatusPill state={state} style={{ marginTop: 6 }} />
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => onRequestRemove?.(item)}
          disabled={quantidade <= 0}
          style={[styles.stepBtn, quantidade <= 0 && styles.stepBtnDisabled]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="minus" size={13} color={colors.textMutedLight} />
        </TouchableOpacity>
        <Text style={[styles.qty, tabularNums]}>{quantidade}</Text>
        <TouchableOpacity
          onPress={() => onReceive?.(item)}
          style={styles.stepBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="plus" size={13} color={colors.textMutedLight} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: {
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  qty: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
});

export default ProductRow;
