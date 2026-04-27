import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Typography } from './Typography';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ title, variant = 'primary', className: extraClassName, style, ...props }: ButtonProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;

  const baseClass = 'py-3 px-6 rounded-lg items-center justify-center my-2';

  const variantClass = (() => {
    switch (variant) {
      case 'primary':
        return 'border';
      case 'secondary':
        return '';
      case 'outline':
        return 'bg-transparent border';
      default:
        return '';
    }
  })();

  const variantStyle = (() => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: tint, borderColor: tint };
      case 'secondary':
        return { backgroundColor: colorScheme === 'dark' ? '#333' : '#EEE' };
      case 'outline':
        return { borderColor: tint };
      default:
        return {};
    }
  })();

  const getTextColor = () => {
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'outline') return tint;
    return Colors[colorScheme ?? 'light'].text;
  };

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${extraClassName || ''}`}
      style={[variantStyle, style]}
      activeOpacity={0.7}
      {...props}
    >
      <Typography
        variant="body"
        className="font-semibold"
        style={{ color: getTextColor() }}
      >
        {title}
      </Typography>
    </TouchableOpacity>
  );
}
