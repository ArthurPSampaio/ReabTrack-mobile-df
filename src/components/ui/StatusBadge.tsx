import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { StatusPlano } from '../../types/dto';

export default function StatusBadge({ status }: { status: StatusPlano }) {
  const map = {
    [StatusPlano.ATIVO]: { 
      bg: colors.primaryLight, 
      fg: colors.primaryDark 
    },
    [StatusPlano.CONCLUIDO]: { 
      bg: '#E6F4EA', 
      fg: colors.success 
    },
    [StatusPlano.CANCELADO]: { 
      bg: '#FCE8E6', 
      fg: colors.danger 
    },
  } as const;
  
  const v = map[status] || map[StatusPlano.ATIVO];
  
  return (
    <View style={{ 
      backgroundColor: v.bg, 
      paddingHorizontal: 10, 
      paddingVertical: 4,
      borderRadius: radius.sm, 
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)' 
    }}>
      <Text style={{ 
        color: v.fg, 
        fontWeight: '700', 
        fontSize: 12,
        textTransform: 'uppercase', 
        letterSpacing: 0.5
      }}>
        {status}
      </Text>
    </View>
  );
}