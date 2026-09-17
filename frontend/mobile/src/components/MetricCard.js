import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, tabularNums } from '../theme/colors';

const VARIANTS = {
  dark: { bg: colors.primary, fg: colors.primaryLight, sub: 'rgba(248,242,234,0.6)' },
  rose: { bg: '#ead8d1', fg: '#5c4540', sub: 'rgba(92,69,64,0.65)' },
  neutral: { bg: colors.surface, fg: colors.text, sub: colors.textMutedLight, border: colors.border },
};

// label/value/detail per Tela 01 spec: mono label, big display value, short detail line.
const MetricCard = ({ label, value, detail, icon, variant = 'neutral', style }) => {
  const tone = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: tone.sub }]}>{label}</Text>
        {icon}
      </View>
      <Text style={[styles.value, tabularNums, { color: tone.fg }]}>{value}</Text>
      {detail ? <Text style={[styles.detail, { color: tone.sub }]}>{detail}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 30,
    marginTop: 14,
  },
  detail: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 6,
  },
});

export default MetricCard;
