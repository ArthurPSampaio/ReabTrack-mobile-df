import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, shadow } from '../../theme/tokens';

export default function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 12,
          ...shadow.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}
