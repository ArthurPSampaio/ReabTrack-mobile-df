import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPaciente } from '../../services/api/patients';
import PatientDetailTabs from '../../navigation/PatientDetailTabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

export default function PatientDetailScreen({ route }: Props) {
  const { id } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => getPaciente(id),
  });

  if (isLoading) {
    return (
      <View style={c}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ padding: spacing(2) }}>
        <Text style={{ fontWeight: '700' }}>Erro ao carregar paciente</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ textDecorationLine: 'underline', marginTop: spacing(1.5) }}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PatientDetailTabs id={id} nome={data.nome} diagnostico={data.diagnostico} />
    </View>
  );
}

const c = { flex: 1, alignItems: 'center', justifyContent: 'center' } as const;