import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts } from '../theme/colors';

const TAB_META = {
  Hoje: { icon: 'sun-compass', label: 'Hoje' },
  Estoque: { icon: 'package-variant', label: 'Estoque' },
  Pedidos: { icon: 'clipboard-list-outline', label: 'Pedidos' },
  Configuracoes: { icon: 'cog-outline', label: 'Ajustes' },
};

// 5-slot bar: Hoje, Estoque, [+ elevated center action], Pedidos, Configurações.
// The center slot is not a tab route — it navigates straight to the
// AddEditProduct stack screen (see AppNavigator), per the design spec's
// "botão central de ação rápida abre o cadastro de produto".
const BottomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const renderTab = (route, index) => {
    const isFocused = state.index === state.routes.indexOf(route);
    const meta = TAB_META[route.name] || { icon: 'circle', label: route.name };
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };
    const tint = isFocused ? colors.secondaryDark : colors.textMutedLight;
    return (
      <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} accessibilityRole="button">
        <MaterialCommunityIcons name={meta.icon} size={21} color={tint} />
        <Text style={[styles.label, { color: tint }]}>{meta.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {leftRoutes.map(renderTab)}

      <TouchableOpacity
        onPress={() => navigation.navigate('AddEditProduct')}
        style={styles.centerBtn}
        accessibilityLabel="Adicionar produto"
      >
        <MaterialCommunityIcons name="plus" size={26} color={colors.primaryLight} />
      </TouchableOpacity>

      {rightRoutes.map(renderTab)}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default BottomTabBar;
