import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

type Props = TextInputProps & { label?: string; helperText?: string };

export default function Input({ label, helperText, style, ...rest }: Props) {
  return (
    <View style={{ gap: spacing(0.75) }}>
      {label && <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.placeholder}
        style={[
          {
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radius.md,
            paddingHorizontal: spacing(1.5),
            paddingVertical: spacing(1.25),
            backgroundColor: colors.background,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
      {!!helperText && <Text style={typography.small}>{helperText}</Text>}
    </View>
  );
}