import React, { useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useMutation } from '@tanstack/react-query';
import { createPlano } from '../../services/api/plans';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanCreate'>;

export default function PlanCreateScreen({ route, navigation }: Props) {
  const { patientId } = route.params;
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [diagnosticoRelacionado, setDiagnosticoRelacionado] = useState('');
  const [dataFimPrevista, setDataFimPrevista] = useState(''); // opcional (YYYY-MM-DD)

  const { mutate, isPending } = useMutation({
    mutationFn: createPlano,
    onSuccess: () => {
      navigation.goBack(); // volta para lista; ela recarrega pelo focus/query
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message?.join?.('\n') || e?.response?.data?.message || e?.message;
      Alert.alert('Erro', String(msg));
    },
  });

  const onSalvar = () => {
    if (!objetivoGeral.trim() || !diagnosticoRelacionado.trim()) {
      Alert.alert('Atenção', 'Preencha “Objetivo Geral” e “Diagnóstico Relacionado”.');
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
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding:16, gap:12 }}>
        <Card style={{ gap:10 }}>
          <View>
            <View>
              <Input placeholder="Objetivo Geral" value={objetivoGeral} onChangeText={setObjetivoGeral} />
            </View>
            <View style={{ marginTop:8 }}>
              <Input placeholder="Diagnóstico Relacionado" value={diagnosticoRelacionado} onChangeText={setDiagnosticoRelacionado} />
            </View>
            <View style={{ marginTop:8 }}>
              <Input placeholder="Data fim prevista (YYYY-MM-DD)" value={dataFimPrevista} onChangeText={setDataFimPrevista} />
            </View>
          </View>
          <Button title={isPending ? 'Salvando...' : 'Criar plano'} onPress={onSalvar} disabled={isPending} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
