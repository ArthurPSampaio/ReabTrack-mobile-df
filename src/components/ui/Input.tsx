import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

type Props = TextInputProps & { label?: string; helperText?: string };

export default function Input({ label, helperText, style, ...rest }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: spacing(0.75) }}>
      {label && <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          {
            borderWidth: isFocused ? 2 : 1, // Borda mais grossa no foco
            borderColor: isFocused ? colors.primary : colors.line, // Cor primária no foco
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