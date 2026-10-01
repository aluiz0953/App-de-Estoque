import React from 'react';
import { View, StyleSheet } from 'react-native';
import { decorative } from '../utils/a11y';

// The Figma product tile: a small perfume bottle drawn with plain Views (no SVG dependency).
// `color` tints the bottle outline/cap/ring; `bg` is the tile behind it.
const SHAPES = {
  round: { w: 16, h: 22, radius: 6 },
  tall: { w: 13, h: 24, radius: 3 },
  wide: { w: 21, h: 18, radius: 7 },
};

const ProductBottle = ({ color, bg, shape = 'round', size = 40 }) => {
  const s = SHAPES[shape] || SHAPES.round;
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: bg }]} {...decorative}>
      <View style={[styles.cap, { backgroundColor: color, width: s.w * 0.4, marginBottom: -1 }]} />
      <View
        style={{
          width: s.w,
          height: s.h,
          borderRadius: s.radius,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: color + '1f',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: s.w * 0.45, height: s.w * 0.45, borderRadius: s.w, borderWidth: 1, borderColor: color, opacity: 0.6 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cap: { height: 5, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
});

export default ProductBottle;
