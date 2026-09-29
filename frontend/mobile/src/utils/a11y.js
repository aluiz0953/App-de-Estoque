import { useEffect, useState } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

// Invisible extra touch area so a control of `size` dp reaches the 48 dp minimum (Android guideline)
// without changing how it looks. Do not use it on neighbours closer than the slop (areas would overlap).
export const slopFor = (size) => {
  const pad = Math.max(0, Math.ceil((48 - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
};

// Props for elements that are only decoration (icons next to text, dividers, thumbnails): the screen reader skips them.
export const decorative = { accessible: false, importantForAccessibility: 'no-hide-descendants' };

// True while the system "remove animations / reduce motion" setting is on: swap springs and slides for a plain fade or nothing.
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setReduce(on)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

// Short vibrations: confirmation that does not depend on sight or hearing (needs the VIBRATE permission).
export const haptic = {
  tap: () => Vibration.vibrate(12),
  success: () => Vibration.vibrate(35),
  error: () => Vibration.vibrate([0, 70, 60, 70]),
};
