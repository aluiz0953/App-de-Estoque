import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import StatusPill from './StatusPill';
import { getStockState, STOCK_STATE_LABEL } from '../utils/stock';
import { decorative, slopFor } from '../utils/a11y';

// "-" opens the parent screen's RemoveStockModal (quantity + motivo picker) —
// removal always needs a reason and the operator may want to remove more than
// one unit, so this can't be a one-tap action. "+" is NOT possible inline at
// all: receiving stock requires a lot number, expiration date and unit cost
// (see /api/estoque/entrada), so it hands off to Entrada de Romaneio
// pre-filled for this product instead of pretending to be a one-tap action.
// Memoized: a screen re-render (typing, modal state) must not re-render every row.
// Callbacks receive the item, so the parent can pass stable handlers.
const ProductRow = ({ item, onPress, onReceive, onRequestRemove }) => {
  const { colors, styles } = useThemedStyles(createStyles);
  const quantidade = item.quantidadeTotal ?? 0;
  const state = getStockState(quantidade, item.estoqueMinimo);

  const brand = item.linha?.marca?.nome;
  const summary = `${item.nome}, ${brand ? `${brand}, ` : ''}SKU ${item.sku}, ${STOCK_STATE_LABEL[state]}, ${quantidade} unidade${quantidade === 1 ? '' : 's'}`;

  // The info area is one focus stop for screen readers; the two step buttons stay separate stops
  // (nesting buttons inside a button would hide them from TalkBack/VoiceOver).
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => onPress?.(item)}
        style={styles.info}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint="Toque duas vezes para abrir os detalhes do produto"
      >
      <View style={styles.thumb} {...decorative}>
        <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color={colors.textMutedLight} />
      </View>

      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.name} numberOfLines={2}>{item.nome}</Text>
        <Text style={[styles.meta, tabularNums]} numberOfLines={1}>
          {item.linha?.marca?.nome ? `${item.linha.marca.nome} · ` : ''}{item.sku}
        </Text>
        <StatusPill state={state} style={{ marginTop: 6 }} />
      </View>
      </TouchableOpacity>

      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => onRequestRemove?.(item)}
          disabled={quantidade <= 0}
          style={[styles.stepBtn, quantidade <= 0 && styles.stepBtnDisabled]}
          hitSlop={slopFor(36)}
          accessibilityRole="button"
          accessibilityLabel={`Remover estoque de ${item.nome}`}
          accessibilityHint="Abre a escolha da quantidade e do motivo"
          accessibilityState={{ disabled: quantidade <= 0 }}
        >
          <MaterialCommunityIcons name="minus" size={16} color={colors.text} {...decorative} />
        </TouchableOpacity>
        <Text style={[styles.qty, tabularNums]} accessible={false} importantForAccessibility="no">{quantidade}</Text>
        <TouchableOpacity
          onPress={() => onReceive?.(item)}
          style={styles.stepBtn}
          hitSlop={slopFor(36)}
          accessibilityRole="button"
          accessibilityLabel={`Receber estoque de ${item.nome}`}
          accessibilityHint="Abre a entrada de romaneio para este produto"
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.text} {...decorative} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
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

export default React.memo(ProductRow);
