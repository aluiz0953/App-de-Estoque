import React from 'react';
import { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

// A list row that steps in once, in order. Capped so a long list never waits; skipped when the system
// asks for reduced motion. (GSAP is DOM-only and cannot drive React Native views; Reanimated does here.)
const RowIn = ({ index = 0, children, style }) => {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.delay(Math.min(index, 10) * 30).duration(280)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

export default RowIn;
