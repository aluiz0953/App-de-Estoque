import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts, tabularNums } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

// A labelled field of the ficha: small label above, the figure below, a rule on top. (icon/tone are accepted
// for compatibility; the figure carries the meaning, not a coloured tile.)
const MetricTile = ({ label, value, detail, onPress }) => {
  const { colors } = useTheme();
  const Root = onPress ? TouchableOpacity : View;
  return (
    <Root
      accessible
      accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}
      {...(onPress ? { onPress, activeOpacity: 0.7, accessibilityRole: 'button', accessibilityHint: 'Toque duas vezes para ver esses produtos' } : null)}
      style={[styles.field, { borderTopColor: colors.text }]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, tabularNums, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {detail ? <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>{detail}</Text> : null}
    </Root>
  );
};

const styles = StyleSheet.create({
  field: { flexBasis: '46%', flexGrow: 1, borderTopWidth: 1.5, paddingTop: 8, minHeight: 48 },
  label: { fontFamily: fonts.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontFamily: fonts.heading, fontSize: 22, marginTop: 4 },
  detail: { fontFamily: fonts.sans, fontSize: 11, marginTop: 2 },
});

export default MetricTile;
