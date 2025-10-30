import React, { useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { createPlano } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/tokens';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanCreate'>;

export default function PlanCreateScreen({ route, navigation }: Props) {
  const { patientId } = route.params;
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [diagnosticoRelacionado, setDiagnosticoRelacionado] = useState('');
  const [dataFimPrevista, setDataFimPrevista] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: createPlano,
    onSuccess: () => navigation.goBack(),
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message?.join?.('\n') ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao criar plano.';
      Alert.alert('Erro', msg);
    },
  });

  const handleSave = () => {
    if (!objetivoGeral.trim() || !diagnosticoRelacionado.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha “Objetivo Geral” e “Diagnóstico Relacionado”.'
      );
      return;
    }

    mutate({
      pacienteId: patientId,
      objetivoGeral,
      diagnosticoRelacionado,
      status: 'Ativo',
      ...(dataFimPrevista ? { dataFimPrevista } : {}),
      atividades: [],
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={[typography.h1]}>Novo Plano</Text>

        <Card style={{ gap: 12 }}>
          <Input
            label="Objetivo Geral"
            placeholder="Ex: Melhorar mobilidade e força"
            value={objetivoGeral}
            onChangeText={setObjetivoGeral}
          />
          <Input
            label="Diagnóstico Relacionado"
            placeholder="Ex: Lesão no joelho esquerdo"
            value={diagnosticoRelacionado}
            onChangeText={setDiagnosticoRelacionado}
          />
          <Input
            label="Data de término (opcional)"
            placeholder="AAAA-MM-DD"
            value={dataFimPrevista}
            onChangeText={setDataFimPrevista}
          />

          <Button
            title={isPending ? 'Salvando...' : 'Criar plano'}
            onPress={handleSave}
            disabled={isPending}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
