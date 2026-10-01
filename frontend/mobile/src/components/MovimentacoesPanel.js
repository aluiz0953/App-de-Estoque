import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import useFetchMovimentacoes from '../hooks/useFetchMovimentacoes';
import MovimentacoesChart from './MovimentacoesChart';
import Panel, { PanelEmpty } from './Panel';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const PERIODOS = [
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 365, label: 'Este ano' },
];

// "Movimentações" card of the dashboard: period chips + the entradas/saídas chart.
const MovimentacoesPanel = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const [dias, setDias] = useState(30);
  const { data, isLoading, error } = useFetchMovimentacoes(dias);
  const vazio = !data || (data.entradas.length === 0 && data.saidas.length === 0);

  return (
    <Panel title="Movimentações" subtitle="Entradas e saídas no período">
      <View style={styles.periodRow}>
        {PERIODOS.map((p) => (
          <TouchableOpacity
            key={p.dias}
            onPress={() => setDias(p.dias)}
            style={[styles.chip, dias === p.dias && styles.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Período: ${p.label}`}
            accessibilityState={{ selected: dias === p.dias }}
          >
            <Text style={[styles.chipText, dias === p.dias && styles.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading && !data ? (
        <ActivityIndicator style={{ marginVertical: 40 }} color={colors.primary} />
      ) : error && !data ? (
        <PanelEmpty>Não foi possível carregar as movimentações.</PanelEmpty>
      ) : vazio ? (
        <PanelEmpty>Nenhuma movimentação neste período.</PanelEmpty>
      ) : (
        <MovimentacoesChart entradas={data.entradas} saidas={data.saidas} dias={dias} />
      )}
    </Panel>
  );
};

const createStyles = (colors) => StyleSheet.create({
  periodRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.textMuted },
  chipTextActive: { color: colors.primaryLight },
});

export default MovimentacoesPanel;
