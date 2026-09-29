import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { STOCK_STATE_LABEL } from '../utils/stock';

const TONES = {
  available: { bg: colors.successBg, ink: colors.successInk },
  low: { bg: colors.warningBg, ink: colors.warningInk },
  out: { bg: colors.neutralBg, ink: colors.neutralInk },
};

// state: 'available' | 'low' | 'out' — always pairs a dot with a text label
// (per the design spec: never communicate status with color alone).
const StatusPill = ({ state, style }) => {
  const tone = TONES[state] || TONES.available;
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
