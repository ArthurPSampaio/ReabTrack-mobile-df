import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';

type Props = TextInputProps & { label?: string; helperText?: string };

export default function Input({ label, helperText, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          {
            borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
            backgroundColor: '#fff',
          },
          style,
        ]}
        {...rest}
      />
      {!!helperText && <Text style={{ fontSize: 12, color: colors.textMuted }}>{helperText}</Text>}
    </View>
  );
}
