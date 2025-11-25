import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';

type Props = TouchableOpacityProps & { 
  title: string; 
  loading?: boolean; 
  variant?: 'primary' | 'outline' | 'text';
};

export default function Button({ title, loading, variant = 'primary', style, ...rest }: Props) {
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';

  const backgroundColor = isPrimary ? colors.primary : 'transparent';
  
  const borderWidth = isText ? 0 : 1.5;
  const borderColor = isText ? 'transparent' : colors.primary;

  const textColor = isPrimary ? colors.white : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        {
          backgroundColor,
          borderColor,
          borderWidth,
          paddingVertical: spacing(1.5),
          paddingHorizontal: spacing(2),
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        style,
      ]}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}