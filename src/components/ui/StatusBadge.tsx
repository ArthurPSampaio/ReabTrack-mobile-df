import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';

export default function StatusBadge({ status }: { status: 'Ativo'|'Concluído'|'Cancelado' }) {
  const map = {
    Ativo:    { bg: '#F1E7CC', fg: colors.brown },
    Concluído:{ bg: '#DCE9D5', fg: colors.success },
    Cancelado:{ bg: '#F3D7D3', fg: colors.danger },
  } as const;
  const v = map[status] || map.Ativo;
  return (
    <View style={{ backgroundColor: v.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, alignSelf: 'flex-start' }}>
      <Text style={{ color: v.fg, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}
