import React, { useState, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Platform, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getPaciente, updatePaciente, deletePaciente } from '../../services/api/patients';
import PatientDetailTabs from '../../navigation/PatientDetailTabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';
import type { PacienteDto } from '../../types/dto';
import { GeneroPaciente } from '../../types/dto';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

// Funções auxiliares de data (mesmas do PatientNewScreen)
const formatarData = (text: string): string => {
  const numeros = text.replace(/\D/g, '');
  const truncado = numeros.slice(0, 8);
  if (truncado.length > 4) return `${truncado.slice(0, 2)}/${truncado.slice(2, 4)}/${truncado.slice(4)}`;
  if (truncado.length > 2) return `${truncado.slice(0, 2)}/${truncado.slice(2)}`;
  return truncado;
};

const formatarDataParaInput = (isoDate?: string): string => {
  if (!isoDate || !isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
  const partes = isoDate.split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
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

export default function PatientDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => getPaciente(id),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<{
    nome?: string;
    dataNascimento?: string;
    genero?: GeneroPaciente | null;
    diagnostico?: string;
    sintomas?: string;
  }>({});

  // --- CONFIGURAÇÃO DO CABEÇALHO (HEADER) ---
  useLayoutEffect(() => {
    navigation.setOptions({
      // Título Customizado: Nome em destaque, diagnóstico pequeno abaixo
      headerTitle: () => (
        <View style={{ alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {data?.nome || 'Carregando...'}
          </Text>
          {!!data?.diagnostico && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: -2 }} numberOfLines={1}>
              {data.diagnostico}
            </Text>
          )}
        </View>
      ),
      // Botões de Ação na direita (Editar/Excluir)
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
           <TouchableOpacity onPress={onOpenEdit} style={{ padding: 4 }}>
             <Ionicons name="pencil" size={22} color={colors.primary} />
           </TouchableOpacity>
           <TouchableOpacity onPress={onConfirmDelete} style={{ padding: 4 }}>
             <Ionicons name="trash-outline" size={22} color={colors.danger} />
           </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, data]);

  // --- LÓGICA DE EDIÇÃO ---
  const onOpenEdit = () => {
    if (!data) return;
    setForm({
      nome: data.nome,
      diagnostico: data.diagnostico,
      dataNascimento: formatarDataParaInput(data.dataNascimento),
      genero: data.genero,
      sintomas: data.sintomas,
    });
    setEditOpen(true);
  };

  const setCampo = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const updMut = useMutation({
    mutationFn: () => {
      let dataNascimentoISO: string | undefined = undefined;
      if (form.dataNascimento && form.dataNascimento.trim()) {
        if (!form.dataNascimento.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          return Promise.reject(new Error('Data de nascimento inválida. Use o formato DD/MM/AAAA.'));
        }
        const partes = form.dataNascimento.split('/');
        dataNascimentoISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
      return updatePaciente(id, {
        nome: form.nome?.toString().trim(),
        dataNascimento: dataNascimentoISO,
        genero: form.genero ?? undefined,
        diagnostico: form.diagnostico?.toString(),
        sintomas: form.sintomas?.toString(),
      });
    },
    onSuccess: async () => {
      setEditOpen(false);
      await qc.invalidateQueries({ queryKey: ['paciente', id] });
      await qc.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: (e: any) => Alert.alert('Erro', String(e?.message || 'Falha ao salvar')),
  });

  const delMut = useMutation({
    mutationFn: () => deletePaciente(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pacientes'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Erro', String(e?.message)),
  });

  const onConfirmDelete = () => {
    Alert.alert('Remover', 'Tem certeza que deseja remover este paciente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => delMut.mutate() },
    ]);
  };

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (isError || !data) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Erro ao carregar paciente</Text>
        <TouchableOpacity onPress={() => refetch()}><Text style={{ color: colors.primary, marginTop: 8 }}>Tentar novamente</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* AS ABAS AGORA OCUPAM A TELA TODA ABAIXO DO HEADER NATIVO */}
      <PatientDetailTabs id={id} />

      {/* MODAL DE EDIÇÃO */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '85%' }}>
            <Text style={[typography.h2, { marginBottom: 16 }]}>Editar Paciente</Text>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Input placeholder="Nome" value={form.nome} onChangeText={(t) => setCampo('nome', t)} />
              <Input placeholder="Data de Nascimento (DD/MM/AAAA)" keyboardType="numeric" maxLength={10} value={form.dataNascimento} onChangeText={(t) => setCampo('dataNascimento', formatarData(t))} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip label="Masculino" active={form.genero === GeneroPaciente.MASCULINO} onPress={() => setCampo('genero', GeneroPaciente.MASCULINO)} />
                <Chip label="Feminino" active={form.genero === GeneroPaciente.FEMININO} onPress={() => setCampo('genero', GeneroPaciente.FEMININO)} />
              </View>
              <Input placeholder="Diagnóstico" value={form.diagnostico} onChangeText={(t) => setCampo('diagnostico', t)} />
              <Input placeholder="Sintomas" value={form.sintomas} onChangeText={(t) => setCampo('sintomas', t)} multiline />
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button title={updMut.isPending ? 'Salvando...' : 'Salvar'} onPress={() => updMut.mutate()} disabled={updMut.isPending} style={{ flex: 1 }} />
              <Button title="Cancelar" variant="outline" onPress={() => setEditOpen(false)} style={{ flex: 1 }} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}