// src/screens/Patients/DashboardScreen.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { listPacientes } from '../../services/api/patients';
import { listAgendaRange, updateSessao } from '../../services/api/agenda';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { SessaoDto, StatusSessao } from '../../types/dto';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const STATUS_LABEL: Record<StatusSessao, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  canceled: 'Cancelada',
  no_show: 'Faltou',
};

function formatHourRange(inicioISO: string, fimISO: string) {
  const i = new Date(inicioISO);
  const f = new Date(fimISO);
  const ok = !isNaN(i.getTime()) && !isNaN(f.getTime());
  if (!ok) return `${inicioISO} → ${fimISO}`;
  const h = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${h(i)} → ${h(f)}`;
}

/** Agrupa por dia **local** (YYYY-MM-DD derivado de Date local) */
function groupByDayLocal(items: SessaoDto[]) {
  type Bucket = { key: string; y: number; m: number; d: number; items: SessaoDto[] };
  const map = new Map<string, Bucket>();

  for (const s of items) {
    const dt = new Date(s.inicio); // Date da sessão em horário local do usuário
    const y = dt.getFullYear();
    const m = dt.getMonth();   // 0..11
    const d = dt.getDate();    // 1..31
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (!map.has(key)) map.set(key, { key, y, m, d, items: [] });
    map.get(key)!.items.push(s);
  }

  // Ordena por data
  return Array.from(map.values()).sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  });
}

/** Rótulo HOJE/AMANHÃ considerando meia-noite **local** */
function formatDayLabelLocal(y: number, m: number, d: number) {
  const hoje = new Date();
  const startHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()); // 00:00 local

  const alvo = new Date(y, m, d); // 00:00 local do dia alvo
  const diffDays = Math.round((alvo.getTime() - startHoje.getTime()) / 86400000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  return alvo.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

export default function DashboardScreen({ navigation }: Props) {
  const qc = useQueryClient();

  // Pacientes recentes
  const pacientesQ = useQuery({
    queryKey: ['pacientes', 'dashboard'],
    queryFn: () => listPacientes(),
  });
  const recentes = (pacientesQ.data || []).slice(0, 5);

  // Próximas sessões (7 dias)
  const agendaQ = useQuery({
    queryKey: ['agenda', 'next7'],
    queryFn: () => listAgendaRange(7),
  });

  // Refetch automático ao ganhar foco
  useFocusEffect(
    useCallback(() => {
      agendaQ.refetch();
      pacientesQ.refetch();
    }, [agendaQ, pacientesQ])
  );

  const grouped = useMemo(() => groupByDayLocal(agendaQ.data || []), [agendaQ.data]);

  const updSessaoMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusSessao }) =>
      updateSessao(id, { status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['agenda', 'next7'] });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          gap: 4,
        }}
      >
        <Text style={[typography.h1]}>Início</Text>
        <Text style={{ ...typography.muted }}>Atalhos e visão rápida para começar o dia.</Text>
      </View>

      <FlatList
        data={[{ key: 'conteudo' }]}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
        renderItem={() => (
          <View style={{ gap: 12 }}>
            {/* Ações rápidas */}
            <Card style={{ gap: 10 }}>
              <Text style={[typography.h2]}>Ações rápidas</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Novo paciente"
                  onPress={() => navigation.navigate('PatientNew')}
                  style={{ flex: 1, paddingVertical: 12 }}
                />
                <Button
                  title="Ver pacientes"
                  variant="outline"
                  onPress={() => navigation.navigate('PatientsList')}
                  style={{ flex: 1, paddingVertical: 12 }}
                />
              </View>
            </Card>

            {/* Próximas sessões (7 dias) */}
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.text} />
                <Text style={[typography.h2]}>Próximas sessões (7 dias)</Text>
              </View>

              {agendaQ.isLoading ? (
                <Text style={typography.muted}>Carregando…</Text>
              ) : (agendaQ.data || []).length === 0 ? (
                <Text style={typography.muted}>Sem sessões neste período.</Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {grouped.map(({ key, y, m, d, items }) => {
                    const label = formatDayLabelLocal(y, m, d);
                    return (
                      <View key={key} style={{ gap: 8 }}>
                        <Text style={{ fontWeight: '700', color: colors.brown }}>{label}</Text>
                        {items.map((s) => {
                          const hour = formatHourRange(s.inicio, s.fim);
                          const pacienteNome = (s as any)?.paciente?.nome;
                          const pacienteId = (s as any).pacienteId ?? (s as any)?.paciente?.id;

                          return (
                            <View
                              key={s.id}
                              style={{
                                borderWidth: 1,
                                borderColor: colors.line,
                                borderRadius: 12,
                                padding: 10,
                                backgroundColor: '#fff',
                                gap: 6,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Text style={{ fontWeight: '700' }}>{hour}</Text>
                                <View
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor:
                                      s.status === 'scheduled'
                                        ? colors.line
                                        : s.status === 'completed'
                                        ? '#8BC34A'
                                        : s.status === 'canceled'
                                        ? '#F44336'
                                        : '#FF9800',
                                    backgroundColor:
                                      s.status === 'scheduled'
                                        ? '#fff'
                                        : s.status === 'completed'
                                        ? '#E8F5E9'
                                        : s.status === 'canceled'
                                        ? '#FDECEA'
                                        : '#FFF3E0',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color:
                                        s.status === 'scheduled'
                                          ? colors.text
                                          : s.status === 'completed'
                                          ? '#2E7D32'
                                          : s.status === 'canceled'
                                          ? '#B71C1C'
                                          : '#E65100',
                                    }}
                                  >
                                    {STATUS_LABEL[s.status]}
                                  </Text>
                                </View>
                              </View>

                              {!!pacienteNome && (
                                <Text style={{ ...typography.muted }} numberOfLines={1}>
                                  {pacienteNome}
                                </Text>
                              )}
                              <Text style={{ ...typography.muted }}>
                                {s.local ? s.local : 'Sem local'}
                              </Text>

                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                <Button
                                  title="Abrir paciente"
                                  variant="outline"
                                  onPress={() =>
                                    navigation.navigate('PatientDetail', {
                                      id: pacienteId,
                                      nome: pacienteNome,
                                    })
                                  }
                                  style={{ flex: 1, paddingVertical: 10 }}
                                />
                                {s.status !== 'completed' && (
                                  <Button
                                    title="Concluir"
                                    onPress={() => updSessaoMut.mutate({ id: s.id, status: 'completed' })}
                                    style={{ flex: 1, paddingVertical: 10 }}
                                  />
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>

            {/* Pacientes recentes */}
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="account-group" size={18} color={colors.text} />
                <Text style={[typography.h2]}>Pacientes recentes</Text>
              </View>

              {pacientesQ.isLoading ? (
                <Text style={typography.muted}>Carregando…</Text>
              ) : recentes.length === 0 ? (
                <Text style={typography.muted}>Sem pacientes cadastrados ainda.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {recentes.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PatientDetail', { id: p.id, nome: p.nome })}
                      style={{
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.line,
                      }}
                    >
                      <Text style={{ fontWeight: '700' }} numberOfLines={1}>
                        {p.nome}
                      </Text>
                      {!!p.diagnostico && (
                        <Text style={{ ...typography.muted }} numberOfLines={1}>
                          {p.diagnostico}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  <View style={{ marginTop: 6 }}>
                    <Button
                      title="Ver todos"
                      variant="outline"
                      onPress={() => navigation.navigate('PatientsList')}
                    />
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}
      />
    </View>
  );
}
