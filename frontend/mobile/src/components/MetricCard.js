import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts, tabularNums } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { decorative } from '../utils/a11y';

const VARIANTS = {
  dark: (c) => ({ bg: c.headerBg, fg: c.headerInk, sub: c.headerSoft }),
  rose: (c) => ({ bg: c.roseBg, fg: c.roseInk, sub: c.roseSoft }),
  neutral: (c) => ({ bg: c.surface, fg: c.text, sub: c.textMutedLight, border: c.border }),
};

// label/value/detail per Tela 01 spec: mono label, big display value, short detail line.
const MetricCard = ({ label, value, detail, icon, variant = 'neutral', style, onPress }) => {
  const { colors } = useTheme();
  const tone = (VARIANTS[variant] || VARIANTS.neutral)(colors);
  const Root = onPress ? TouchableOpacity : View;
  return (
    <Root
      accessible
      accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}
      {...(onPress ? { onPress, activeOpacity: 0.8, accessibilityRole: 'button', accessibilityHint: 'Toque duas vezes para ver esses produtos' } : null)}
      style={[
        styles.card,
        { backgroundColor: tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: tone.sub }]}>{label}</Text>
        <View {...decorative}>{icon}</View>
      </View>
      <Text style={[styles.value, tabularNums, { color: tone.fg }]}>{value}</Text>
      {detail ? <Text style={[styles.detail, { color: tone.sub }]}>{detail}</Text> : null}
    </Root>
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
