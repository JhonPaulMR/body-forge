import React from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ContainerProps extends SafeAreaViewProps {
  style?: ViewStyle;
}

export function Container({ className: extraClassName, style, children, ...props }: ContainerProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView
      className={`flex-1 px-4 ${extraClassName || ''}`}
      style={[{ backgroundColor: theme.background }, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
