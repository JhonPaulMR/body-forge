import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Dumbbell, Clock, BarChart3, BicepsFlexed } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, (color: string) => React.ReactNode> = {
    index: (color) => <Home size={20} color={color} />,
    planos: (color) => <Dumbbell size={20} color={color} />,
    treino: (color) => <BicepsFlexed size={20} color={color} />,
    historico: (color) => <Clock size={20} color={color} />,
    estatisticas: (color) => <BarChart3 size={20} color={color} />,
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-forge-surface-alt rounded-t-3xl pt-3 px-3 border-t border-forge-border"
      style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12, elevation: 10 }}
    >
      <View className="flex-row justify-around items-center">
        {state.routes.map((route, index) => {
          if (route.name === 'two') return null;
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? '#A0C4FF' : '#5F6368';
          const label = options.title ?? route.name;

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

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              className={`items-center justify-center py-2 px-4 rounded-2xl ${isFocused ? 'bg-forge-accent-bg' : ''}`}
            >
              {icons[route.name]?.(color)}
              <Text className="text-[10px] font-semibold mt-1" style={{ color }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="planos" options={{ title: 'Planos' }} />
      <Tabs.Screen name="treino" options={{ title: 'Treino' }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="estatisticas" options={{ title: 'Estatísticas' }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

export const TAB_BAR_HEIGHT = 72;
