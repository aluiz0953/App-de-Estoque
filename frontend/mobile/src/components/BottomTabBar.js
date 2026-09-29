import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { useReduceMotion } from '../utils/a11y';

// A floating dock: five icons in a pill. Press and slide a finger across it and the name of
// the icon under the finger rises above it (lift to pick); the last icon does not open a
// menu, the pill itself unfolds into one. Layout follows the "dock that unfolds" pattern.
// Everything around the pill is transparent: the bar floats over the screens (absolute), so
// content scrolls behind it; screens add useDockClearance() as bottom padding.
const { width: SCREEN_W } = Dimensions.get('window');
const PILL_W = Math.min(SCREEN_W - 32, 380);
const PILL_H = 62;
const PAD = 6;
const SLOT_W = (PILL_W - PAD * 2) / 5;
const LABEL_W = 150;
const LABEL_ROOM = 34;
const ROW_H = 52;
const CANCEL_DY = 60; // sliding this far off the dock cancels the pick
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const ADD_INK = '#2d2724'; // the rose "+" dot keeps the same ink in both themes

const ITEMS = [
  { key: 'Hoje', icon: 'sun-compass', label: 'Hoje', route: 'Hoje' },
  { key: 'Estoque', icon: 'package-variant', label: 'Estoque', route: 'Estoque' },
  { key: 'add', icon: 'plus', label: 'Novo produto', action: 'AddEditProduct', accent: true },
  { key: 'Pedidos', icon: 'clipboard-list-outline', label: 'Pedidos', route: 'Pedidos' },
  { key: 'more', icon: 'dots-horizontal', label: 'Mais', more: true },
];

const MORE_ITEMS = [
  { icon: 'history', label: 'Histórico', go: 'Histórico' },
  { icon: 'package-down', label: 'Entrada de romaneio', go: 'EntradaRomaneio' },
  { icon: 'cog-outline', label: 'Ajustes', go: 'Configuracoes' },
];
const PANEL_H = PILL_H + MORE_ITEMS.length * ROW_H + 8;

// Bottom padding that keeps the last item of a tab screen clear of the floating dock.
export function useDockClearance() {
  const insets = useSafeAreaInsets();
  return PILL_H + Math.max(insets.bottom, 10) + 6 + 16;
}

const indexAt = (pageX) => {
  const x = pageX - (SCREEN_W - PILL_W) / 2 - PAD;
  return Math.max(0, Math.min(ITEMS.length - 1, Math.floor(x / SLOT_W)));
};

const BottomTabBar = ({ state, navigation }) => {
  const { colors, styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 10) + 6;

  const activeName = state.routes[state.index]?.name;
  const activeIndex =
    activeName === 'Configuracoes' ? ITEMS.length - 1 : Math.max(0, ITEMS.findIndex((item) => item.route === activeName));

  const reduceMotion = useReduceMotion();
  const [hover, setHover] = useState(null);
  const [labelIndex, setLabelIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const bubble = useRef(new Animated.Value(activeIndex)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelX = useRef(new Animated.Value(0)).current;
  const menu = useRef(new Animated.Value(0)).current;

  // The active-tab bubble glides to the current tab.
  useEffect(() => {
    if (reduceMotion) bubble.setValue(activeIndex);
    else Animated.spring(bubble, { toValue: activeIndex, damping: 16, stiffness: 190, mass: 0.7, useNativeDriver: true }).start();
  }, [activeIndex, bubble, reduceMotion]);

  // The label follows the finger between icons and fades in/out.
  useEffect(() => {
    if (hover === null) {
      Animated.timing(labelOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      return;
    }
    setLabelIndex(hover);
    const centre = PAD + hover * SLOT_W + SLOT_W / 2 - LABEL_W / 2;
    const clamped = Math.max(0, Math.min(PILL_W - LABEL_W, centre));
    Animated.spring(labelX, { toValue: clamped, damping: 18, stiffness: 260, mass: 0.6, useNativeDriver: true }).start();
    Animated.timing(labelOpacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  }, [hover, labelOpacity, labelX]);

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(menu, { toValue: 1, duration: reduceMotion ? 0 : 360, easing: EASE, useNativeDriver: false }).start();
  };
  const closeMenu = (after) => {
    Animated.timing(menu, { toValue: 0, duration: reduceMotion ? 0 : 220, easing: EASE, useNativeDriver: false }).start(() => {
      setMenuOpen(false);
      if (after) after();
    });
  };

  const activate = (index) => {
    const item = ITEMS[index];
    if (item.more) {
      openMenu();
    } else if (item.action) {
      navigation.navigate(item.action);
    } else {
      const route = state.routes.find((r) => r.name === item.route);
      if (!route) return;
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (activeName !== item.route && !event.defaultPrevented) navigation.navigate(route.name);
    }
  };
  const activateRef = useRef(activate);
  activateRef.current = activate;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => setHover(indexAt(event.nativeEvent.pageX)),
      onPanResponderMove: (event, gesture) =>
        setHover(Math.abs(gesture.dy) < CANCEL_DY ? indexAt(event.nativeEvent.pageX) : null),
      onPanResponderRelease: (event, gesture) => {
        setHover(null);
        if (Math.abs(gesture.dy) < CANCEL_DY) activateRef.current(indexAt(event.nativeEvent.pageX));
      },
      onPanResponderTerminate: () => setHover(null),
    }),
  ).current;

  const bubbleX = bubble.interpolate({ inputRange: [0, ITEMS.length - 1], outputRange: [0, (ITEMS.length - 1) * SLOT_W] });
  const panelHeight = menu.interpolate({ inputRange: [0, 1], outputRange: [PILL_H, PANEL_H] });
  const showBubble = ITEMS[activeIndex] && !ITEMS[activeIndex].accent;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomGap }]}>
      <Animated.View pointerEvents="none" style={[styles.labelLane, { opacity: labelOpacity }]}>
        <Animated.View style={[styles.label, { transform: [{ translateX: labelX }] }]}>
          <Text style={styles.labelText} numberOfLines={1}>
            {ITEMS[labelIndex].label}
          </Text>
        </Animated.View>
      </Animated.View>

      <View style={styles.pill} {...pan.panHandlers}>
        {showBubble && <Animated.View style={[styles.bubble, { transform: [{ translateX: bubbleX }] }]} />}
        {ITEMS.map((item, index) => {
          const focused = index === activeIndex && !item.accent;
          return (
            <View
              key={item.key}
              style={styles.slot}
              accessible
              accessibilityRole={item.route ? 'tab' : 'button'}
              accessibilityLabel={item.label}
              accessibilityState={{ selected: focused }}
              onAccessibilityTap={() => activate(index)}
            >
              {item.accent ? (
                <View style={styles.addDot}>
                  <MaterialCommunityIcons name="plus" size={24} color={ADD_INK} />
                </View>
              ) : (
                <MaterialCommunityIcons name={item.icon} size={23} color={focused || hover === index ? colors.dockInk : colors.dockInkSoft} />
              )}
            </View>
          );
        })}
      </View>

      <Modal transparent visible={menuOpen} animationType="none" statusBarTranslucent onRequestClose={() => closeMenu()}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()}>
          <Animated.View style={[styles.backdrop, { opacity: menu }]} />
        </Pressable>
        {/* Same footprint as the pill, growing upward: the pill becomes the menu. */}
        <Animated.View style={[styles.panel, { bottom: bottomGap, height: panelHeight }]}>
          <View style={styles.rows}>
            {MORE_ITEMS.map((item) => (
              <Animated.View key={item.label} style={{ opacity: menu }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => closeMenu(() => navigation.navigate(item.go))}
                >
                  <MaterialCommunityIcons name={item.icon} size={22} color={colors.dockInk} />
                  <Text style={styles.rowText}>{item.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            onPress={() => closeMenu()}
            style={styles.closeSlot}
          >
            <MaterialCommunityIcons name="close" size={23} color={colors.dockInk} />
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: LABEL_ROOM },
  labelLane: { position: 'absolute', top: 4, left: (SCREEN_W - PILL_W) / 2, width: PILL_W, height: 26 },
  label: {
    width: LABEL_W,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.dockBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: { color: colors.dockInk, fontFamily: fonts.sansMedium, fontSize: 12 },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundColor: colors.dockBg,
    borderWidth: 1,
    borderColor: colors.dockLine,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  bubble: {
    position: 'absolute',
    left: PAD + 4,
    top: PAD,
    width: SLOT_W - 8,
    height: PILL_H - PAD * 2,
    borderRadius: (PILL_H - PAD * 2) / 2,
    backgroundColor: colors.dockBubble,
  },
  slot: { width: SLOT_W, height: PILL_H, alignItems: 'center', justifyContent: 'center' },
  addDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  panel: {
    position: 'absolute',
    left: (SCREEN_W - PILL_W) / 2,
    width: PILL_W,
    borderRadius: 30,
    backgroundColor: colors.dockBg,
    borderWidth: 1,
    borderColor: colors.dockLine,
    overflow: 'hidden',
    elevation: 14,
  },
  rows: { paddingTop: 10, paddingHorizontal: PAD },
  row: { height: ROW_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 16 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rowText: { color: colors.dockInk, fontFamily: fonts.sansMedium, fontSize: 15, marginLeft: 14 },
  closeSlot: {
    position: 'absolute',
    right: PAD,
    bottom: 0,
    width: SLOT_W,
    height: PILL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabBar;
