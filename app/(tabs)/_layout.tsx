import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          // Esconde a tab "two" que não faz parte do protótipo
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
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              {icons[route.name]?.(color)}
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
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

const TAB_BAR_HEIGHT = 72;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2D35',
    // Sombra sutil para cima
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tabItemActive: {
    backgroundColor: '#252B3B',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});

export { TAB_BAR_HEIGHT };
