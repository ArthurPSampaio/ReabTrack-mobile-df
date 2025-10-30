import React from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listPlanosByPaciente } from '../../services/api/plans';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, PatientDetailTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientDetailTabParamList, 'Plans'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PatientPlansTab({ route, navigation }: Props) {
  const { id } = route.params;
  const planosQ = useQuery({
    queryKey: ['planos', id],
    queryFn: () => listPlanosByPaciente(id),
  });

  const planos = planosQ.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <View>
          <Text style={[typography.h1]}>Planos</Text>
          <Text style={typography.muted}>
            {planos.length
              ? `${planos.length} ${planos.length === 1 ? 'plano ativo' : 'planos ativos'}`
              : 'Nenhum plano cadastrado'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('PlanCreate', { patientId: id })}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '700' }}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={planos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={!!planosQ.isRefetching || planosQ.isLoading}
            onRefresh={planosQ.refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !planosQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <Text style={[typography.h2]}>Nenhum plano ainda</Text>
              <Text style={{ ...typography.muted, textAlign: 'center' }}>
                Crie um plano para registrar objetivos e atividades do paciente.
              </Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
            activeOpacity={0.9}
          >
            <Card style={{ padding: 14, gap: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h2]} numberOfLines={2}>
                    {item.objetivoGeral}
                  </Text>
                  <Text style={typography.muted} numberOfLines={2}>
                    {item.diagnosticoRelacionado}
                  </Text>
                </View>
                <StatusBadge status={item.status as any} />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {item.atividades?.length || 0} atividades
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
