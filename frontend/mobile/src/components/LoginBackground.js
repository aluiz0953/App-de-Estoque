import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

// Mobile counterpart of the web login's animated shader (HeroGeometric):
// soft rose shapes drifting slowly over the cream background. Built on the
// core Animated API (native driver), so no extra native dependency.
const { width, height } = Dimensions.get('window');

const BLOBS = [
  { size: width * 1.1, color: colors.secondary, opacity: 0.35, top: -width * 0.45, left: -width * 0.35, dx: 40, dy: 60, duration: 9000 },
  { size: width * 0.9, color: colors.secondaryDark, opacity: 0.18, top: height * 0.55, left: width * 0.35, dx: -50, dy: -40, duration: 11000 },
  { size: width * 0.7, color: colors.secondary, opacity: 0.22, top: height * 0.3, left: -width * 0.4, dx: 60, dy: 30, duration: 13000 },
];

function Blob({ size, color, opacity, top, left, dx, dy, duration }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

const LoginBackground = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {BLOBS.map((blob, i) => (
      <Blob key={i} {...blob} />
    ))}
  </View>
);

export default LoginBackground;
