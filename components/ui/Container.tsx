import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ContainerProps extends SafeAreaViewProps {
  style?: ViewStyle;
}

export function Container({ style, children, ...props }: ContainerProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: theme.background },
        styles.container,
        style,
      ]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});
