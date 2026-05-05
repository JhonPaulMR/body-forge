import React from 'react';
import { Text, TextProps } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
}

const variantClasses: Record<string, string> = {
  h1: 'text-[28px] font-bold mb-2',
  h2: 'text-[22px] font-semibold mb-1.5',
  body: 'text-base leading-6',
  caption: 'text-xs text-forge-muted',
};

export function Typography({ variant = 'body', className: extraClassName, style, ...props }: TypographyProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Text
      className={`${variantClasses[variant] || ''} ${extraClassName || ''}`}
      style={[{ color: theme.text }, style]}
      {...props}
    />
  );
}
