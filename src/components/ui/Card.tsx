import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, shadow, spacing } from '../../theme/tokens';

export default function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          padding: spacing(2),
          ...shadow.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}