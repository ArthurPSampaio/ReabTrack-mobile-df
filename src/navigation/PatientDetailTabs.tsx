import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import PatientPlansTab from '../screens/tabs/PatientPlansTab';
import PatientSessionsTab from '../screens/tabs/PatientSessionsTab';
import PatientHistoryTab from '../screens/tabs/PatientHistoryTab';
import PatientReportTab from '../screens/tabs/PatientReportTab';

import type { PatientDetailTabParamList } from './types';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { updatePaciente, deletePaciente } from '../services/api/patients';
// --- A CORREÇÃO ESTÁ AQUI ---
import { GeneroPaciente, PacienteDto } from '../types/dto'; 

const Tabs = createBottomTabNavigator<PatientDetailTabParamList>();

type Props = {
  id: string;
  nome?: string;
  diagnostico?: string;
};

type HeaderProps = {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

// --- 1. FUNÇÃO DA MÁSCARA DE DATA ---
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

// --- 2. FUNÇÃO DE CONVERSÃO INVERSA (AAAA-MM-DD para DD/MM/AAAA) ---
const formatarDataParaInput = (isoDate?: string): string => {
  if (!isoDate || !isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return ''; // Retorna vazio se a data for inválida ou indefinida
  }
  const partes = isoDate.split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
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

function PatientHeader({ title, subtitle, onEdit, onDelete }: HeaderProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(0.75), paddingBottom: spacing(1.75), gap: spacing(1.25) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              paddingHorizontal: spacing(1.5),
              paddingVertical: spacing(1),
              borderRadius: 999,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing(0.5),
            }}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Voltar</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {!!onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={{
                padding: spacing(1),
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.surface,
                marginRight: spacing(1),
              }}
              accessibilityRole="button"
              accessibilityLabel="Editar paciente"
            >
              <Ionicons name="pencil" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          {!!onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={{
                padding: spacing(1),
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: '#FBEAEB',
              }}
              accessibilityRole="button"
              accessibilityLabel="Remover paciente"
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ gap: spacing(0.25) }}>
          <Text style={[typography.h1]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={typography.small} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function PatientDetailTabs({ id, nome, diagnostico }: Props) {
  const navigation = useNavigation();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  
  const [form, setForm] = useState<{
    nome?: string;
    dataNascimento?: string;
    genero?: GeneroPaciente | null;
    diagnostico?: string;
    sintomas?: string;
  }>({
    nome,
    diagnostico,
  });

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
      } else {
        return Promise.reject(new Error('Data de nascimento é obrigatória.'));
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
    onError: (e: any) => {
      const msg = e?.message || e?.response?.data?.message?.join?.('\n') || e?.response?.data?.message;
      Alert.alert('Erro', String(msg ?? 'Falha ao salvar'));
    },
  });

  const delMut = useMutation({
    mutationFn: () => deletePaciente(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pacientes'] });
      // @ts-ignore
      navigation.goBack();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao remover';
      Alert.alert('Erro', String(msg));
    },
  });

  const onOpenEdit = () => {
    const pacienteAtual = qc.getQueryData<PacienteDto>(['paciente', id]);
    
    setForm({
      nome: pacienteAtual?.nome ?? nome,
      diagnostico: pacienteAtual?.diagnostico ?? diagnostico,
      dataNascimento: formatarDataParaInput(pacienteAtual?.dataNascimento),
      genero: pacienteAtual?.genero ?? null,
      sintomas: pacienteAtual?.sintomas ?? '',
    });
    setEditOpen(true);
  };

  const onConfirmDelete = () => {
    Alert.alert('Remover paciente', 'Esta ação não pode ser desfeita. Remover mesmo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => delMut.mutate() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <PatientHeader
        title={nome ?? 'Paciente'}
        subtitle={diagnostico}
        onEdit={onOpenEdit}
        onDelete={onConfirmDelete}
      />

      <View style={{ flex: 1 }}>
        <Tabs.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopColor: colors.line,
              borderTopWidth: 1,
              height: 62,
              paddingBottom: spacing(0.75),
              paddingTop: spacing(0.5),
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
            tabBarIcon: ({ color, size }) => {
              const s = size ?? 24;
              switch (route.name) {
                case 'Plans':
                  return <Ionicons name="clipboard-outline" size={s} color={color} />;
                case 'Sessions':
                  return <Ionicons name="calendar-outline" size={s} color={color} />;
                case 'History':
                  return <Ionicons name="time-outline" size={s} color={color} />;
                case 'Report':
                  return <Ionicons name="document-text-outline" size={s} color={color} />;
                default:
                  return null;
              }
            },
          })}
          initialRouteName="Plans"
        >
          <Tabs.Screen
            name="Plans"
            component={PatientPlansTab}
            initialParams={{ id }}
            options={{ title: 'Planos' }}
          />
          <Tabs.Screen
            name="Sessions"
            component={PatientSessionsTab}
            initialParams={{ id }}
            options={{ title: 'Sessões' }}
          />
          <Tabs.Screen
            name="History"
            component={PatientHistoryTab}
            initialParams={{ id }}
            options={{ title: 'Histórico' }}
          />
          <Tabs.Screen
            name="Report"
            component={PatientReportTab}
            initialParams={{ id }}
            options={{ title: 'Relatório' }}
          />
        </Tabs.Navigator>
      </View>

      <Modal
        visible={editOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <SafeAreaView
            edges={['bottom']}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              padding: spacing(2),
              gap: spacing(1),
              maxHeight: '80%',
            }}
          >
            <Text style={[typography.h2, { marginBottom: spacing(1.5) }]}>Editar paciente</Text>

            <ScrollView contentContainerStyle={{ gap: spacing(1.25), paddingBottom: spacing(1) }}>
              <Input
                placeholder="Nome"
                value={String(form.nome ?? '')}
                onChangeText={(t) => setCampo('nome', t)}
              />
              
              <Input
                placeholder="Data de Nascimento (DD/MM/AAAA)"
                keyboardType="numeric"
                maxLength={10}
                value={form.dataNascimento !== undefined ? String(form.dataNascimento) : ''}
                onChangeText={(t) => setCampo('dataNascimento', formatarData(t))}
              />

              <View style={{ gap: spacing(1) }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>Gênero</Text>
                
                <View style={{ flexDirection: 'row', gap: spacing(1) }}>
                  <Chip 
                    label="Masculino" 
                    active={form.genero === GeneroPaciente.MASCULINO} 
                    onPress={() => setCampo('genero', GeneroPaciente.MASCULINO)} 
                  />
                  <Chip 
                    label="Feminino" 
                    active={form.genero === GeneroPaciente.FEMININO} 
                    onPress={() => setCampo('genero', GeneroPaciente.FEMININO)} 
                  />
                </View>
              </View>
              
              <Input
                placeholder="Diagnóstico"
                value={String(form.diagnostico ?? '')}
                onChangeText={(t) => setCampo('diagnostico', t)}
              />
              <Input
                placeholder="Sintomas"
                value={String(form.sintomas ?? '')}
                onChangeText={(t) => setCampo('sintomas', t)}
                multiline
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing(1.25), marginTop: spacing(1) }}>
              <Button
                title={updMut.isPending ? 'Salvando...' : 'Salvar'}
                onPress={() => updMut.mutate()}
                disabled={updMut.isPending}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setEditOpen(false)}
                style={{ flex: 1 }}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}