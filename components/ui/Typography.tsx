import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
}

export function Typography({ variant = 'body', style, ...props }: TypographyProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Text
      style={[
        { color: theme.text },
        styles[variant],
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    color: '#888',
  },
});
