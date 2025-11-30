import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { listPacientes } from '../../services/api/patients';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors } from '../../theme/colors';
import { typography, spacing } from '../../theme/tokens';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientsList'>;

export default function PatientsListScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pacientes', debounced],
    queryFn: () => listPacientes(debounced || undefined),
  });

  const pacientes = useMemo(() => {
    const base = data || [];
    if (!debounced) return base;
    const term = debounced.toLowerCase();
    return base.filter((p) =>
      `${p.nome ?? ''} ${p.diagnostico ?? ''} ${p.sintomas ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, debounced]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ padding: spacing(2) }}>
        <Text>Erro ao carregar pacientes.</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ textDecorationLine: 'underline', marginTop: spacing(1) }}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing(2), gap: spacing(1.5), flex: 1 }}>
        <View style={{ gap: spacing(1) }}>
          <Text style={[typography.h1]}>Pacientes</Text>

          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.placeholder}
              style={{ position: 'absolute', left: spacing(1.5), zIndex: 1 }}
            />
            <Input
              placeholder="Buscar por nome ou diagnóstico..."
              value={search}
              onChangeText={setSearch}
              style={{ paddingLeft: spacing(5) }}
            />
          </View>
        </View>

        <Button
          title="Novo Paciente"
          onPress={() => navigation.navigate('PatientNew')}
        />

        <FlatList
          data={pacientes || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing(1.25), paddingBottom: spacing(3), flexGrow: 1 }} // flexGrow ajuda a centralizar o empty state
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(6), gap: spacing(1.5), opacity: 0.7 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.line, alignItems:'center', justifyContent:'center', marginBottom: 8 }}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={40}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[typography.h2, { textAlign: 'center', color: colors.textMuted }]}>
                 {debounced ? 'Nenhum paciente encontrado' : 'Sua lista está vazia'}
              </Text>
              <Text
                style={{
                  ...typography.small,
                  textAlign: 'center',
                  paddingHorizontal: spacing(4),
                  maxWidth: 300
                }}
              >
                {debounced
                  ? 'Tente buscar por outro nome ou diagnóstico.'
                  : 'Cadastre seu primeiro paciente para começar a gerenciar os tratamentos.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={{ paddingVertical: spacing(1.5) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name="account-heart-outline"
                    size={24}
                    color={colors.primaryDark}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={typography.small} numberOfLines={2}>
                    {item.diagnostico}
                  </Text>
                </View>

                <Button
                  title="Abrir"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('PatientDetail', {
                      id: item.id,
                      nome: item.nome,
                    })
                  }
                  style={{ paddingHorizontal: spacing(2), paddingVertical: spacing(1) }}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}