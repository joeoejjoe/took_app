import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<string, { icon: IconName; iconFocused: IconName; label: string }> = {
  Home: { icon: 'home-outline', iconFocused: 'home', label: 'Home' },
  Products: { icon: 'grid-outline', iconFocused: 'grid', label: 'Products' },
  Exchange: { icon: 'swap-horizontal-outline', iconFocused: 'swap-horizontal', label: 'Exchange' },
  Ranking: { icon: 'trophy-outline', iconFocused: 'trophy', label: 'Ranking' },
  My: { icon: 'person-outline', iconFocused: 'person', label: 'My' },
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16, backgroundColor: colors.tabBarBg, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name];
        const isExchange = route.name === 'Exchange';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isExchange) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.exchangeWrapper}
            >
              <View style={[styles.exchangeButton, { backgroundColor: isFocused ? colors.primary : colors.primaryMuted }]}>
                <Ionicons
                  name={isFocused ? config.iconFocused : config.icon}
                  size={24}
                  color={isFocused ? colors.buttonPrimaryText : colors.white}
                />
              </View>
              <Text style={[styles.label, { color: isFocused ? colors.tabBarActive : colors.tabBarInactive }]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <Ionicons
              name={isFocused ? config.iconFocused : config.icon}
              size={22}
              color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
            />
            <Text style={[styles.label, { color: isFocused ? colors.tabBarActive : colors.tabBarInactive }]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  exchangeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -20,
    gap: 4,
  },
  exchangeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
