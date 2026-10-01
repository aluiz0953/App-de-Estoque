import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Panel, { PanelEmpty } from './Panel';
import ProductBottle from './ProductBottle';
import StatusPill from './StatusPill';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { getStockState, STOCK_STATE_LABEL } from '../utils/stock';
import { decorative, slopFor } from '../utils/a11y';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

// Tile colours / bottle shapes cycle through the rows, like the Figma product list.
const TONS = ['Pink', 'Green', 'Purple', 'Rose'];
const FORMAS = ['round', 'tall', 'wide'];

// "Produtos recentes" card of the dashboard: the latest products with bottle tile, stock badge and price.
const RecentProductsPanel = ({ produtos, onOpen, onSeeAll }) => {
  const { colors, styles } = useThemedStyles(createStyles);
  return (
    <Panel
      title="Produtos recentes"
      subtitle="Últimos cadastrados no seu catálogo"
      action={
        <TouchableOpacity
          onPress={onSeeAll}
          hitSlop={slopFor(20)}
          style={styles.seeAll}
          accessibilityRole="button"
          accessibilityLabel="Ver todos os produtos"
        >
          <Text style={styles.seeAllText}>Ver todos</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.tileGreenInk} {...decorative} />
        </TouchableOpacity>
      }
    >
      {produtos.length === 0 ? (
        <PanelEmpty>Nenhum produto cadastrado ainda.</PanelEmpty>
      ) : (
        produtos.map((p, i) => {
          const tom = TONS[i % TONS.length];
          const state = getStockState(p.quantidadeTotal, p.estoqueMinimo);
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.row}
              onPress={() => onOpen(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`${p.nome}, ${p.linha?.marca?.nome || ''}, ${STOCK_STATE_LABEL[state]}, ${p.quantidadeTotal ?? 0} unidades, ${money(p.precoVenda)}`}
            >
              <ProductBottle color={colors[`tile${tom}Ink`]} bg={colors[`tile${tom}Bg`]} shape={FORMAS[i % FORMAS.length]} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name} numberOfLines={1}>{p.nome}</Text>
                <Text style={[styles.meta, tabularNums]} numberOfLines={1}>
                  {p.linha?.marca?.nome || 'N/A'} · {p.sku}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.price, tabularNums]}>{money(p.precoVenda)}</Text>
                <StatusPill state={state} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </Panel>
  );
};

const createStyles = (colors) => StyleSheet.create({
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.tileGreenInk },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderColor: colors.border },
  name: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.text },
  meta: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMutedLight, marginTop: 2 },
  price: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.text },
});

export default RecentProductsPanel;
