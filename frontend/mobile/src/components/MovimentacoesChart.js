import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { agrupar } from '../utils/movimentacoes';

const HEIGHT = 130;
const GRID_LINES = 3;

// Entradas (green) vs saídas (pink) per period bucket, as paired bars: the phone version of the Figma
// "Movimentações" chart (a line chart would need an SVG native library). Drawn with plain Views.
const MovimentacoesChart = ({ entradas, saidas, dias }) => {
  const { colors } = useTheme();
  const rows = useMemo(() => agrupar(entradas, saidas, dias), [entradas, saidas, dias]);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.entradas, r.saidas)));
  const total = (campo) => rows.reduce((sum, r) => sum + r[campo], 0);
  const labelIdx = new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1]);

  return (
    <View
      accessible
      accessibilityLabel={`Movimentações no período: ${total('entradas')} unidades de entrada e ${total('saidas')} de saída`}
    >
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Entradas · {total('entradas')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Saídas · {total('saidas')}</Text>
        </View>
      </View>

      <View style={styles.plotRow}>
        <View style={styles.yAxis}>
          {[max, Math.round((max * 2) / 3), Math.round(max / 3), 0].map((v, i) => (
            <Text key={i} style={[styles.axis, { color: colors.textMutedLight }]}>{v}</Text>
          ))}
        </View>
        <View style={styles.plot}>
          {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
            <View key={i} style={[styles.grid, { top: (HEIGHT / GRID_LINES) * i, backgroundColor: colors.border }]} />
          ))}
          <View style={styles.bars}>
            {rows.map((r, i) => (
              <View key={i} style={styles.bucket}>
                <View style={[styles.bar, { height: Math.max(r.entradas ? 2 : 0, (r.entradas / max) * HEIGHT), backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: Math.max(r.saidas ? 2 : 0, (r.saidas / max) * HEIGHT), backgroundColor: colors.secondary }]} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.xRow}>
        {rows.map((r, i) => (
          <Text key={i} style={[styles.xLabel, { color: colors.textMutedLight }]} numberOfLines={1}>
            {labelIdx.has(i) ? r.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: fonts.sans, fontSize: 11 },
  plotRow: { flexDirection: 'row' },
  yAxis: { height: HEIGHT, justifyContent: 'space-between', paddingRight: 6, width: 30, alignItems: 'flex-end' },
  axis: { fontFamily: fonts.sans, fontSize: 9, lineHeight: 10 },
  plot: { flex: 1, height: HEIGHT },
  grid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  bucket: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  bar: { width: '34%', maxWidth: 9, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  xRow: { flexDirection: 'row', marginLeft: 30, marginTop: 6 },
  xLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 9, textAlign: 'center' },
});

export default MovimentacoesChart;
