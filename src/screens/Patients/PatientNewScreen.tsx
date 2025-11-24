import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaciente } from '../../services/api/patients';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { typography, spacing } from '../../theme/tokens';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GeneroPaciente, PacienteDto } from '../../types/dto'; // Importe o Enum e o DTO

type Props = NativeStackScreenProps<RootStackParamList, 'PatientNew'>;

type FormPaciente = {
  nome: string;
  dataNascimento: string;
  genero: GeneroPaciente | null; // Use o Enum
  diagnostico: string;
  sintomas: string;
};

const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={{
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      borderWidth: 1.5,
      borderColor: active ? colors.primary : colors.line,
      borderRadius: 999,
      backgroundColor: active ? colors.primary : colors.background,
    }}
  >
    <Text style={{ color: active ? colors.white : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
  </TouchableOpacity>
);

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

export default function PatientNewScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormPaciente>({
    nome: '',
    dataNascimento: '',
    genero: null,
    diagnostico: '',
    sintomas: '',
  });

  const updateField = (key: keyof FormPaciente, value: any) => {
    let valorFinal = value;
    if (key === 'dataNascimento') {
      valorFinal = formatarData(value);
    }
    setForm((prev) => ({ ...prev, [key]: valorFinal }));
  };

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
    if (!form.genero) {
      Alert.alert('Atenção', 'Selecione o gênero.');
      return;
    }
    if (!form.dataNascimento.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      Alert.alert('Atenção', 'Informe a data de nascimento completa no formato DD/MM/AAAA.');
      return;
    }

    const partes = form.dataNascimento.split('/');
    const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;

    //
    // --- A CORREÇÃO ESTÁ AQUI ---
    // Montamos o payload manualmente. Após o 'if (!form.genero)',
    // o TypeScript sabe que 'form.genero' é do tipo 'GeneroPaciente' (e não 'null').
    //
    const payload: Omit<PacienteDto, "id"> = {
      nome: form.nome,
      dataNascimento: dataISO,
      genero: form.genero, // Agora o tipo é inferido corretamente
      diagnostico: form.diagnostico,
      sintomas: form.sintomas,
    };

    mutate(payload);
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: spacing(2), gap: spacing(1.5) }}
    >
      <Text style={[typography.h1]}>Novo Paciente</Text>

      <Card style={{ gap: spacing(1.5) }}>
        <Input label="Nome" onChangeText={(t) => updateField('nome', t)} />
        
        <Input
          label="Data de Nascimento"
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
          maxLength={10}
          value={form.dataNascimento}
          onChangeText={(t) => updateField('dataNascimento', t)}
        />
        
        <View style={{ gap: spacing(1) }}>
          <Text style={{ fontWeight: '600', color: colors.text }}>Gênero</Text>
          <View style={{ flexDirection: 'row', gap: spacing(1) }}>
            <Chip 
              label="Masculino" 
              active={form.genero === GeneroPaciente.MASCULINO} 
              onPress={() => updateField('genero', GeneroPaciente.MASCULINO)} 
            />
            <Chip 
              label="Feminino" 
              active={form.genero === GeneroPaciente.FEMININO} 
              onPress={() => updateField('genero', GeneroPaciente.FEMININO)} 
            />
          </View>
        </View>

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