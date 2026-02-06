import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomTabBar from '../components/common/CustomTabBar';

import HomeScreen from '../screens/Home/HomeScreen';
import ProductsScreen from '../screens/Products/ProductsScreen';
import ExchangeScreen from '../screens/Exchange/ExchangeScreen';
import TransferScreen from '../screens/Transfer/TransferScreen';
import MyScreen from '../screens/My/MyScreen';

const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const ProductsStack = createNativeStackNavigator();
const ExchangeStack = createNativeStackNavigator();
const TransferStack = createNativeStackNavigator();
const MyStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function ProductsStackScreen() {
  return (
    <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductsStack.Screen name="ProductsMain" component={ProductsScreen} />
    </ProductsStack.Navigator>
  );
}

function ExchangeStackScreen() {
  return (
    <ExchangeStack.Navigator screenOptions={{ headerShown: false }}>
      <ExchangeStack.Screen name="ExchangeMain" component={ExchangeScreen} />
    </ExchangeStack.Navigator>
  );
}

function TransferStackScreen() {
  return (
    <TransferStack.Navigator screenOptions={{ headerShown: false }}>
      <TransferStack.Screen name="TransferMain" component={TransferScreen} />
    </TransferStack.Navigator>
  );
}

function MyStackScreen() {
  return (
    <MyStack.Navigator screenOptions={{ headerShown: false }}>
      <MyStack.Screen name="MyMain" component={MyScreen} />
    </MyStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Products" component={ProductsStackScreen} />
      <Tab.Screen name="Exchange" component={ExchangeStackScreen} />
      <Tab.Screen name="Transfer" component={TransferStackScreen} />
      <Tab.Screen name="My" component={MyStackScreen} />
    </Tab.Navigator>
  );
}
