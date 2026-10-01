import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, tabularNums } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { decorative } from '../utils/a11y';

// The Figma metric card: a coloured icon tile beside a label, a big value and a short detail line.
// tone = green | pink | rose | purple (theme keys tile<Tone>Bg / tile<Tone>Ink).
const MetricTile = ({ label, value, detail, icon, tone = 'green', onPress }) => {
  const { colors } = useTheme();
  const key = tone.charAt(0).toUpperCase() + tone.slice(1);
  const Root = onPress ? TouchableOpacity : View;
  return (
    <Root
      accessible
      accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}
      {...(onPress ? { onPress, activeOpacity: 0.8, accessibilityRole: 'button', accessibilityHint: 'Toque duas vezes para ver esses produtos' } : null)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.icon, { backgroundColor: colors[`tile${key}Bg`] }]} {...decorative}>
        <MaterialCommunityIcons name={icon} size={20} color={colors[`tile${key}Ink`]} />
      </View>
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, tabularNums, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {detail ? <Text style={[styles.detail, { color: colors.textMutedLight }]} numberOfLines={1}>{detail}</Text> : null}
    </Root>
  );
};

const styles = StyleSheet.create({
  card: { flexBasis: '48%', flexGrow: 1, borderRadius: 15, borderWidth: 1, padding: 14 },
  icon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  label: { fontFamily: fonts.sans, fontSize: 11 },
  value: { fontFamily: fonts.display, fontSize: 24, marginTop: 4 },
  detail: { fontFamily: fonts.sansMedium, fontSize: 10, marginTop: 4 },
});

export default MetricTile;
