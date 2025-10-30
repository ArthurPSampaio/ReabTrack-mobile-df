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
import { typography } from '../theme/tokens';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { updatePaciente, deletePaciente } from '../services/api/patients';

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

function PatientHeader({ title, subtitle, onEdit, onDelete }: HeaderProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: '#EFE8DB',
            }}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>‹ Voltar</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {!!onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: '#EFE8DB',
                marginRight: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Editar paciente"
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
          {!!onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: '#FAE4E1',
              }}
              accessibilityRole="button"
              accessibilityLabel="Remover paciente"
            >
              <Ionicons name="trash-outline" size={18} color="#A33" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ gap: 2 }}>
          <Text style={[typography.h1]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={{ ...typography.muted }} numberOfLines={2}>
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
    idade?: number;
    genero?: string;
    diagnostico?: string;
    sintomas?: string;
  }>({
    nome,
    diagnostico,
  });

  const setCampo = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const updMut = useMutation({
    mutationFn: () =>
      updatePaciente(id, {
        nome: form.nome?.toString().trim(),
        idade: typeof form.idade === 'number' ? form.idade : undefined,
        genero: form.genero?.toString(),
        diagnostico: form.diagnostico?.toString(),
        sintomas: form.sintomas?.toString(),
      }),
    onSuccess: async () => {
      setEditOpen(false);
      await qc.invalidateQueries({ queryKey: ['paciente', id] });
      await qc.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message?.join?.('\n') || e?.response?.data?.message || e?.message;
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
    setForm({
      nome: form.nome ?? nome,
      diagnostico: form.diagnostico ?? diagnostico,
      idade: form.idade,
      genero: form.genero,
      sintomas: form.sintomas,
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
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              borderTopWidth: 1,
              height: 62,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarLabelStyle: { fontSize: 12 },
            tabBarIcon: ({ color, size }) => {
              const s = size ?? 22;
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
            backgroundColor: 'rgba(0,0,0,0.25)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              gap: 8,
              maxHeight: '80%',
            }}
          >
            <Text style={[typography.h2, { marginBottom: 12 }]}>Editar paciente</Text>

            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              <Input
                placeholder="Nome"
                value={String(form.nome ?? '')}
                onChangeText={(t) => setCampo('nome', t)}
              />
              <Input
                placeholder="Idade"
                keyboardType="numeric"
                value={form.idade !== undefined ? String(form.idade) : ''}
                onChangeText={(t) => setCampo('idade', Number(t || 0))}
              />
              <Input
                placeholder="Gênero"
                value={String(form.genero ?? '')}
                onChangeText={(t) => setCampo('genero', t)}
              />
              <Input
                placeholder="Diagnóstico"
                value={String(form.diagnostico ?? '')}
                onChangeText={(t) => setCampo('diagnostico', t)}
              />
              <Input
                placeholder="Sintomas"
                value={String(form.sintomas ?? '')}
                onChangeText={(t) => setCampo('sintomas', t)}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button
                title={updMut.isPending ? 'Salvando...' : 'Salvar'}
                onPress={() => updMut.mutate()}
                disabled={updMut.isPending}
                style={{ paddingVertical: 12 }}
              />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setEditOpen(false)}
                style={{ paddingVertical: 12 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
