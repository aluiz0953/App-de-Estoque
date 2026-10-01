import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// Mobile counterpart of the web login's shader (HeroGeometric): the same noise-driven,
// dithered rose/cream gradient, without any circles. React Native cannot run the WebGL
// shader without a native library, so three frames of the shader are pre-rendered
// (scripts/generate-login-background.py) and cross-faded slowly with a gentle zoom
// drift. Only opacity/transform are animated, both on the native driver.
const LIGHT = [require('../assets/login-bg-a.webp'), require('../assets/login-bg-b.webp'), require('../assets/login-bg-c.webp')];
const DARK = [require('../assets/login-bg-dark-a.webp'), require('../assets/login-bg-dark-b.webp'), require('../assets/login-bg-dark-c.webp')];

const fill = StyleSheet.absoluteFillObject;

const LoginBackground = () => {
  const { isDark } = useTheme();
  const [FRAME_A, FRAME_B, FRAME_C] = isDark ? DARK : LIGHT;
  const frameB = useRef(new Animated.Value(0)).current;
  const frameC = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    // "Reduce motion" keeps the still frame: the look stays, the movement goes.
    if (reduceMotion) return undefined;

    const fade = (value, duration, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );

    // Different periods so the three frames never line up: the pattern keeps changing.
    const animations = [
      fade(frameB, 9000),
      fade(frameC, 13000, 6000),
      fade(drift, 16000),
    ];
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [reduceMotion, frameB, frameC, drift]);

  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View pointerEvents="none" style={fill}>
      <Animated.View style={[fill, { transform: [{ scale }] }]}>
        <Animated.Image source={FRAME_A} style={fill} resizeMode="cover" fadeDuration={0} />
        <Animated.Image source={FRAME_B} style={[fill, { opacity: frameB }]} resizeMode="cover" fadeDuration={0} />
        <Animated.Image source={FRAME_C} style={[fill, { opacity: frameC }]} resizeMode="cover" fadeDuration={0} />
      </Animated.View>
    </View>
  );
};

export default LoginBackground;
