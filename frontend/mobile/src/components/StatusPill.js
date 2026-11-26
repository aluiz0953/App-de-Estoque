import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STOCK_STATE_LABEL } from '../utils/stock';

// state: 'available' | 'low' | 'out'. A stamp, not a pill: bordered, uppercase mono, one ink. The state also shows
// in form (full bar, dashed bar, struck line), so it never rests on colour alone.
const StatusPill = ({ state, style }) => {
  const { colors } = useTheme();
  const ink = state === 'low' ? colors.secondaryDark : state === 'out' ? colors.neutralInk : colors.primaryDark;
  return (
    <View style={[styles.stamp, { borderColor: ink }, style]}>
      <View
        style={[
          styles.glyph,
          state === 'available' && { backgroundColor: ink },
          state === 'low' && { borderWidth: 1.5, borderStyle: 'dashed', borderColor: ink },
          state === 'out' && { height: 1.5, backgroundColor: ink },
        ]}
      />
      <Text style={[styles.text, { color: ink }]}>{STOCK_STATE_LABEL[state]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 3,
    borderWidth: 1.5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 6,
  },
  glyph: { width: 14, height: 6, borderRadius: 1 },
  text: { fontFamily: fonts.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default StatusPill;
