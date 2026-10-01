import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SORT_OPTIONS } from '../utils/stock';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// "Ordenar": A→Z, Z→A, menor preço, maior preço. Tapping the active chip goes back to the default order.
const SortChips = ({ value, onChange }) => {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Ordenar</Text>
      {SORT_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(active ? null : option.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Ordenar por ${option.label}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  label: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: colors.textMutedLight },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.textMuted },
  chipTextActive: { color: colors.primaryLight },
});

export default SortChips;
