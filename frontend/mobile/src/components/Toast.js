import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { focusIslandSupported, showFocusIsland } from '../services/focusIsland';
import { decorative, haptic, useReduceMotion } from '../utils/a11y';

const ToastContext = createContext(() => {});

// Usage: const showToast = useToast(); showToast('Estoque recebido');
export const useToast = () => useContext(ToastContext);

// A status bar taller than a plain 24-28 dp bar means a camera cutout (notch / punch hole).
export const NOTCH_MIN_TOP_INSET = 28;

// Height of the top system area. On Android a solid status bar reports a 0 safe-area inset
// (the app is laid out below it), so StatusBar.currentHeight is the reliable number there;
// on iOS the safe-area inset is (Math.max covers both, and never double counts).
export function useStatusInset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, StatusBar.currentHeight || 0);
}

const VISIBLE_MS = 3200;
const MAX_ITEMS = 2;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const { width: SCREEN_W } = Dimensions.get('window');
const ISLAND_W = Math.min(SCREEN_W - 32, 380);
const ISLAND_H = 44;
const SPLIT_LEFT_W = 52; // the older message shrinks to a badge-only capsule
const SPLIT_GAP = 8;

// Icon and colour follow what the message says, so the badge at the left of the island
// already tells the story (offline, failure, or plain success).
function badgeFor(message, colors) {
  const text = String(message).toLowerCase();
  if (text.includes('sem conexão')) return { icon: 'cloud-off-outline', bg: '#8a6d3b' };
  if (/(erro|falha|insuficiente|inválid)/.test(text)) return { icon: 'alert-circle-outline', bg: '#a9494b' };
  return { icon: 'check', bg: colors.secondaryDark };
}

function Capsule({ item, compact, style }) {
  const { colors } = useTheme();
  const badge = badgeFor(item.message, colors);
  return (
    <Animated.View style={[styles.capsule, style]}>
      <View style={[styles.badge, { backgroundColor: badge.bg }]} {...decorative}>
        <MaterialCommunityIcons name={badge.icon} size={16} color="#fff" />
      </View>
      {!compact && (
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      )}
    </Animated.View>
  );
}

// A dynamic island for notch phones: it grows out of the camera cutout, carries the app's
// badge at the left, and when a second message arrives while the first is still up, the
// island pulls apart into two capsules (the earlier message shrinks to its badge, the new
// one takes the rest) before folding back into the notch.
function Island({ items, top }) {
  const enter = useRef(new Animated.Value(0)).current; // 0 = hidden in the notch, 1 = open
  const split = useRef(new Animated.Value(0)).current; // 0 = one pill, 1 = two capsules
  const visible = items.length > 0;
  const two = items.length > 1;
  const reduceMotion = useReduceMotion(); // no travelling/splitting: the island just fades in and out

  useEffect(() => {
    Animated.timing(enter, { toValue: visible ? 1 : 0, duration: reduceMotion ? 120 : visible ? 380 : 260, easing: EASE, useNativeDriver: true }).start();
  }, [visible, enter, reduceMotion]);

  useEffect(() => {
    Animated.timing(split, { toValue: two ? 1 : 0, duration: reduceMotion ? 0 : 340, easing: EASE, useNativeDriver: false }).start();
  }, [two, split, reduceMotion]);

  const [first, second] = items;
  const leftWidth = split.interpolate({ inputRange: [0, 1], outputRange: [ISLAND_W, SPLIT_LEFT_W] });
  const rightWidth = split.interpolate({ inputRange: [0, 1], outputRange: [0, ISLAND_W - SPLIT_LEFT_W - SPLIT_GAP] });
  const scaleX = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 1 : 0.32, 1] });
  const scaleY = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 1 : 0.72, 1] });
  // Starts up at the camera cutout and settles just below the status bar (never over the camera).
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : -(top / 2 + ISLAND_H / 2 + 3), 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.island, { top, opacity: enter, transform: [{ translateY }, { scaleX }, { scaleY }] }]}
    >
      {first && <Capsule item={first} compact={two} style={{ width: leftWidth }} />}
      {second && <Capsule item={second} style={{ width: rightWidth, marginLeft: SPLIT_GAP, overflow: 'hidden' }} />}
    </Animated.View>
  );
}

export const ToastProvider = ({ children }) => {
  const { colors } = useTheme();
  const statusInset = useStatusInset();
  const hasNotch = statusInset > NOTCH_MIN_TOP_INSET;
  const [snack, setSnack] = useState({ visible: false, message: '' });
  const systemIsland = useRef(false); // true when the phone's own island (Xiaomi) accepts this app
  const [items, setItems] = useState([]);
  const seq = useRef(0);
  const timers = useRef(new Map());

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    focusIslandSupported().then((ok) => {
      systemIsland.current = ok;
    });
  }, []);

  const showInApp = useCallback(
    (message) => {
      if (!hasNotch) {
        setSnack({ visible: true, message });
        return;
      }
      const id = (seq.current += 1);
      setItems((current) => [...current, { id, message }].slice(-MAX_ITEMS));
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          setItems((current) => current.filter((item) => item.id !== id));
        }, VISIBLE_MS)
      );
    },
    [hasNotch]
  );

  // The phone's own island first (Xiaomi HyperOS, only when the system authorises this app);
  // otherwise the app's island under the status bar (notch phones) or a snackbar.
  const showToast = useCallback(
    (message) => {
      // A screen reader user cannot see the island: say it, and give a short vibration (longer pattern for problems).
      AccessibilityInfo.announceForAccessibility(String(message));
      if (badgeFor(message, colors).icon === 'check') haptic.success();
      else haptic.error();
      if (systemIsland.current) {
        showFocusIsland('Perfumaria Estoque', String(message)).then((handled) => {
          if (!handled) showInApp(message);
        });
        return;
      }
      showInApp(message);
    },
    [showInApp, colors]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {/* With a transparent status bar the content is pushed below it; the island is drawn as
          a sibling starting at the very top of the screen, around the camera cutout. */}
      <View style={{ flex: 1, paddingTop: hasNotch ? statusInset : 0 }}>{children}</View>
      {hasNotch ? (
        <Island items={items} top={statusInset + 6} />
      ) : (
        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
          duration={2600}
          style={{ backgroundColor: colors.primary, borderRadius: 10, marginBottom: 8 }}
        >
          {snack.message}
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  island: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    width: ISLAND_W,
    height: ISLAND_H,
    zIndex: 100,
    elevation: 20,
  },
  capsule: {
    height: ISLAND_H,
    borderRadius: ISLAND_H / 2,
    backgroundColor: '#0b0908',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  message: { flex: 1, color: '#f4efe8', fontSize: 13, marginLeft: 10, marginRight: 10 },
});
