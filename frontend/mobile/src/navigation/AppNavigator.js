import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';

// Screens
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import OrdersScreen from '../screens/OrdersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';
import MovimentacaoDetailScreen from '../screens/MovimentacaoDetailScreen';
import EntradaRomaneioScreen from '../screens/EntradaRomaneioScreen';
import AddEditPedidoScreen from '../screens/AddEditPedidoScreen';
import PedidoDetailScreen from '../screens/PedidoDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs: Hoje, Estoque, [+ central], Pedidos, Configurações — per the
// AromaStock mobile design spec. Histórico is not a tab (spec doesn't ask for
// one); it stays reachable from Detalhe do Produto and from Configurações.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Hoje" component={HomeScreen} />
      <Tab.Screen name="Estoque" component={InventoryScreen} />
      <Tab.Screen name="Pedidos" component={OrdersScreen} />
      <Tab.Screen name="Configuracoes" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen
        name="AddEditProduct"
        component={AddEditProductScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Histórico" component={HistoryScreen} />
      <Stack.Screen name="MovimentacaoDetail" component={MovimentacaoDetailScreen} />
      <Stack.Screen name="EntradaRomaneio" component={EntradaRomaneioScreen} />
      <Stack.Screen name="PedidoDetail" component={PedidoDetailScreen} />
      <Stack.Screen
        name="AddEditPedido"
        component={AddEditPedidoScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
