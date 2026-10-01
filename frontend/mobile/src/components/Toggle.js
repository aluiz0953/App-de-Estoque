import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';

// Native counterpart of the "Toggle" transition from transitions.dev: the thumb slides
// with an overshoot-and-settle bounce (same easing curve, 350 ms) while the "on" track
// cross-fades over the "off" one. Everything animated uses the native driver.
const TRACK_W = 38;
const TRACK_H = 22;
const PAD = 3;
const THUMB = 16;
const TRAVEL = TRACK_W - PAD * 2 - THUMB;

const Toggle = ({ value, onValueChange, disabled, accessibilityLabel }) => {
  const { styles } = useThemedStyles(createStyles);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const mounted = useRef(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      reduceMotion.current = on;
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // No animation on first paint: only an actual change plays the bounce.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: reduceMotion.current ? 0 : 350,
      easing: Easing.bezier(0.34, 1.35, 0.64, 1), // overshoots past the end, then settles
      useNativeDriver: true,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={{ top: 13, bottom: 13, left: 5, right: 5 }}
      onPress={() => onValueChange(!value)}
      style={[styles.track, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.trackOn, { opacity: progress }]} />
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
};

const createStyles = (colors) => StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    backgroundColor: colors.toggleOff,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackOn: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.toggleOn },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.toggleThumb,
    elevation: 1,
  },
  disabled: { opacity: 0.5 },
});

export default React.memo(Toggle);
