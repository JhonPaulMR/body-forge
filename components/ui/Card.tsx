import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

export function Card({ className: extraClassName, style, children, ...props }: ViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`rounded-xl p-4 my-2 shadow ${extraClassName || ''}`}
      style={[
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
