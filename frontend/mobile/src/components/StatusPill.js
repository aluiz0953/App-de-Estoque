import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STOCK_STATE_LABEL } from '../utils/stock';

const TONES = {
  available: (c) => ({ bg: c.successBg, ink: c.successInk }),
  low: (c) => ({ bg: c.warningBg, ink: c.warningInk }),
  out: (c) => ({ bg: c.neutralBg, ink: c.neutralInk }),
};

// state: 'available' | 'low' | 'out' — always pairs a dot with a text label
// (per the design spec: never communicate status with color alone).
const StatusPill = ({ state, style }) => {
  const { colors } = useTheme();
  const tone = (TONES[state] || TONES.available)(colors);
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: tone.ink }]} />
      <Text style={[styles.text, { color: tone.ink }]}>{STOCK_STATE_LABEL[state]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default StatusPill;
