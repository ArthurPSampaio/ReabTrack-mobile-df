import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaciente } from '../../services/api/patients';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { typography } from '../../theme/tokens';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientNew'>;

type FormPaciente = {
  nome: string;
  idade: number;
  genero: string;
  diagnostico: string;
  sintomas: string;
};

export default function PatientNewScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormPaciente>({
    nome: '',
    idade: 0,
    genero: '',
    diagnostico: '',
    sintomas: '',
  });

  const updateField = (key: keyof FormPaciente, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { mutate, isPending } = useMutation({
    mutationFn: createPaciente,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pacientes'] });
      navigation.goBack();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao salvar paciente.';
      Alert.alert('Erro', msg);
    },
  });

  const handleSubmit = () => {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do paciente.');
      return;
    }
    mutate(form);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={[typography.h1]}>Novo Paciente</Text>

      <Card style={{ gap: 12 }}>
        <Input label="Nome" onChangeText={(t) => updateField('nome', t)} />
        <Input
          label="Idade"
          keyboardType="numeric"
          onChangeText={(t) => updateField('idade', Number(t || 0))}
        />
        <Input label="Gênero" onChangeText={(t) => updateField('genero', t)} />
        <Input
          label="Diagnóstico"
          onChangeText={(t) => updateField('diagnostico', t)}
        />
        <Input
          label="Sintomas"
          multiline
          onChangeText={(t) => updateField('sintomas', t)}
        />

        <Button
          title={isPending ? 'Salvando...' : 'Salvar'}
          onPress={handleSubmit}
          disabled={isPending}
        />
      </Card>
    </ScrollView>
  );
}
