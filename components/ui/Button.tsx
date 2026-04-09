import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ title, variant = 'primary', style, ...props }: ButtonProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;

  const getVariantStyles = (): StyleProp<ViewStyle> => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: tint, borderColor: tint, borderWidth: 1 };
      case 'secondary':
        return { backgroundColor: colorScheme === 'dark' ? '#333' : '#EEE' };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: tint, borderWidth: 1 };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'outline') return tint;
    return Colors[colorScheme ?? 'light'].text;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      <Typography
        variant="body"
        style={[styles.text, { color: getTextColor() }]}
      >
        {title}
      </Typography>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  text: {
    fontWeight: '600',
  },
});
