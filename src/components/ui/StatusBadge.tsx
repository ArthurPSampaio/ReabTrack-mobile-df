import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { StatusPlano } from '../../types/dto'; // Importe o Enum

export default function StatusBadge({ status }: { status: StatusPlano }) {
  const map = {
    [StatusPlano.ATIVO]: { bg: colors.primaryLight, fg: colors.primaryDark },
    [StatusPlano.CONCLUIDO]: { bg: '#E4F4EC', fg: colors.success },
    [StatusPlano.CANCELADO]: { bg: '#FBEAEB', fg: colors.danger },
  } as const;
  
  const v = map[status] || map[StatusPlano.ATIVO];
  
  return (
    <View style={{ backgroundColor: v.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, alignSelf: 'flex-start' }}>
      <Text style={{ color: v.fg, fontWeight: '700', fontSize: 13 }}>{status}</Text>
    </View>
  );
}