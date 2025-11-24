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
import { typography, spacing } from '../../theme/tokens';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { StatusPlano } from '../../types/dto';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanCreate'>;

const formatarData = (text: string): string => {
  const numeros = text.replace(/\D/g, '');
  const truncado = numeros.slice(0, 8);
  if (truncado.length > 4) {
    return `${truncado.slice(0, 2)}/${truncado.slice(2, 4)}/${truncado.slice(4)}`;
  }
  if (truncado.length > 2) {
    return `${truncado.slice(0, 2)}/${truncado.slice(2)}`;
  }
  return truncado;
};

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

    let dataISO: string | undefined = undefined;
    if (dataFimPrevista.trim()) {
      if (!dataFimPrevista.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        Alert.alert('Atenção', 'Data de término inválida. Use o formato DD/MM/AAAA.');
        return;
      }
      const partes = dataFimPrevista.split('/');
      dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    mutate({
      pacienteId: patientId,
      objetivoGeral,
      diagnosticoRelacionado,
      status: StatusPlano.ATIVO,
      dataFimPrevista: dataISO, 
      atividades: [],
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing(2), gap: spacing(2) }}>
        <Text style={[typography.h1]}>Novo Plano</Text>

        <Card style={{ gap: spacing(1.5) }}>
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
            placeholder="DD/MM/AAAA" 
            keyboardType="numeric"
            maxLength={10}
            value={dataFimPrevista}
            onChangeText={(t) => setDataFimPrevista(formatarData(t))} 
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