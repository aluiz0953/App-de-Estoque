import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

// Placeholder rows shown while a list loads: the screen keeps its final shape
// (no jump when data arrives) and feels faster than a centered spinner. One
// shared native-driven pulse animates every block, so it costs almost nothing.
const SkeletonList = ({ rows = 8 }) => {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View accessibilityLabel="Carregando" accessible>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.row}>
          <Animated.View style={[styles.thumb, { opacity: pulse }]} />
          <View style={styles.lines}>
            <Animated.View style={[styles.line, { width: '65%', opacity: pulse }]} />
            <Animated.View style={[styles.line, styles.lineShort, { opacity: pulse }]} />
          </View>
          <Animated.View style={[styles.pill, { opacity: pulse }]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.border },
  lines: { flex: 1, marginHorizontal: 12 },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.border },
  lineShort: { width: '40%', height: 10, marginTop: 8 },
  pill: { width: 56, height: 24, borderRadius: 12, backgroundColor: colors.border },
});

export default React.memo(SkeletonList);
