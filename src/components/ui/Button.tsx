import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';

type Props = TouchableOpacityProps & { title: string; loading?: boolean; variant?: 'primary'|'outline' };

export default function Button({ title, loading, variant='primary', style, ...rest }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: isPrimary ? colors.primary : 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
          paddingVertical: 12,
          borderRadius: radius.lg,
          alignItems: 'center',
        },
        style,
      ]}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text style={{ color: isPrimary ? colors.white : colors.primary, fontWeight: '700' }}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
