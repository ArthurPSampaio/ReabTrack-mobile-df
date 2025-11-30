import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listPacientes } from '../../services/api/patients';
import { listAgendaRange, updateSessao } from '../../services/api/agenda';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { typography, spacing, radius } from '../../theme/tokens';
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getTodayString() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatHourRange(inicioISO: string, fimISO: string) {
  const i = new Date(inicioISO);
  const f = new Date(fimISO);
  const valid = !isNaN(i.getTime()) && !isNaN(f.getTime());
  if (!valid) return `${inicioISO} → ${fimISO}`;
  const h = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${h(i)} → ${h(f)}`;
}

function groupByDayLocal(items: SessaoDto[]) {
  type Bucket = { key: string; y: number; m: number; d: number; items: SessaoDto[] };
  const map = new Map<string, Bucket>();

  for (const s of items) {
    const dt = new Date(s.inicio);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    const d = dt.getDate();
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (!map.has(key)) map.set(key, { key, y, m, d, items: [] });
    map.get(key)!.items.push(s);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  });
}

function formatDayLabelLocal(y: number, m: number, d: number) {
  const hoje = new Date();
  const startHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const alvo = new Date(y, m, d);
  const diffDays = Math.round((alvo.getTime() - startHoje.getTime()) / 86400000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  return alvo.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

export default function DashboardScreen({ navigation }: Props) {
  const qc = useQueryClient();

  const pacientesQ = useQuery({
    queryKey: ['pacientes', 'dashboard'],
    queryFn: () => listPacientes(),
  });
  // Pega apenas os 3 últimos para não poluir demais
  const recentes = (pacientesQ.data || []).slice(0, 3);

  const agendaQ = useQuery({
    queryKey: ['agenda', 'next7'],
    queryFn: () => listAgendaRange(7),
  });

  useFocusEffect(
    useCallback(() => {
      agendaQ.refetch();
      pacientesQ.refetch();
    }, [agendaQ, pacientesQ])
  );

  const grouped = useMemo(() => groupByDayLocal(agendaQ.data || []), [agendaQ.data]);

  const updSessaoMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusSessao }) => updateSessao(id, { status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['agenda', 'next7'] });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView
        edges={['top']}
        style={{
          backgroundColor: colors.surface,
          paddingBottom: spacing(1),
        }}
      >
        <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(1), gap: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted, textTransform: 'capitalize' }}>
            {getTodayString()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
             <Text style={[typography.h1, { color: colors.primaryDark }]}>
               {getGreeting()}, Fisioterapeuta
             </Text>
             <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center' }}>
                <MaterialCommunityIcons name="doctor" size={24} color="white" />
             </View>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={[{ key: 'conteudo' }]}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: spacing(2), gap: spacing(2), paddingBottom: spacing(4) }}
        renderItem={() => (
          <View style={{ gap: spacing(2) }}>
            
            {/* Atalhos Rápidos */}
            <View style={{ flexDirection: 'row', gap: spacing(1.5) }}>
              <TouchableOpacity 
                 onPress={() => navigation.navigate('PatientNew')}
                 style={{ flex: 1, backgroundColor: colors.background, padding: spacing(1.5), borderRadius: radius.md, gap: 8, flexDirection:'row', alignItems:'center', elevation: 2, shadowColor: '#000', shadowOpacity:0.05, shadowRadius:4, shadowOffset:{width:0, height:2} }}
              >
                 <View style={{ width:36, height:36, borderRadius:18, backgroundColor: colors.primaryLight, alignItems:'center', justifyContent:'center' }}>
                    <MaterialCommunityIcons name="account-plus" size={20} color={colors.primary} />
                 </View>
                 <Text style={{ fontWeight:'600', color: colors.text }}>Novo Paciente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                 onPress={() => navigation.navigate('PatientsList')}
                 style={{ flex: 1, backgroundColor: colors.background, padding: spacing(1.5), borderRadius: radius.md, gap: 8, flexDirection:'row', alignItems:'center', elevation: 2, shadowColor: '#000', shadowOpacity:0.05, shadowRadius:4, shadowOffset:{width:0, height:2} }}
              >
                 <View style={{ width:36, height:36, borderRadius:18, backgroundColor: '#F4EAD9', alignItems:'center', justifyContent:'center' }}>
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.brown} />
                 </View>
                 <Text style={{ fontWeight:'600', color: colors.text }}>Meus Pacientes</Text>
              </TouchableOpacity>
            </View>

            {/* --- SEÇÃO ADICIONADA: PACIENTES RECENTES --- */}
            <View style={{ gap: spacing(1) }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={[typography.h3]}>Pacientes recentes</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PatientsList')}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Ver todos</Text>
                  </TouchableOpacity>
               </View>

               {pacientesQ.isLoading ? (
                  <Text style={typography.small}>Carregando...</Text>
               ) : recentes.length === 0 ? (
                  <Card style={{ alignItems: 'center', paddingVertical: spacing(2) }}>
                     <Text style={typography.small}>Nenhum paciente cadastrado.</Text>
                  </Card>
               ) : (
                  <Card style={{ padding: 0, overflow: 'hidden' }}>
                    {recentes.map((p, index) => (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('PatientDetail', { id: p.id, nome: p.nome })}
                        style={{
                          padding: spacing(1.5),
                          borderBottomWidth: index < recentes.length - 1 ? 1 : 0,
                          borderBottomColor: colors.line,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                           <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                           <Text style={{ fontWeight: '600', color: colors.text }}>{p.nome}</Text>
                           {!!p.diagnostico && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>{p.diagnostico}</Text>}
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
                      </TouchableOpacity>
                    ))}
                  </Card>
               )}
            </View>

            {/* Agenda */}
            <View style={{ gap: spacing(1) }}>
              <Text style={[typography.h3]}>Próximas sessões</Text>
              
              {agendaQ.isLoading ? (
                <Text style={typography.small}>Carregando agenda...</Text>
              ) : (agendaQ.data || []).length === 0 ? (
                <Card style={{ alignItems: 'center', paddingVertical: spacing(3), gap: spacing(1) }}>
                   <MaterialCommunityIcons name="calendar-check" size={40} color={colors.line} />
                   <Text style={typography.small}>Nenhuma sessão agendada para os próximos 7 dias.</Text>
                </Card>
              ) : (
                <View style={{ gap: spacing(1.5) }}>
                  {grouped.map(({ key, y, m, d, items }) => {
                    const label = formatDayLabelLocal(y, m, d);
                    return (
                      <View key={key} style={{ gap: spacing(1) }}>
                        <Text style={{ fontWeight: '700', color: colors.textMuted, fontSize: 14, marginLeft: 4 }}>{label}</Text>
                        {items.map((s) => {
                          const hour = formatHourRange(s.inicio, s.fim);
                          const pacienteNome = (s as any)?.paciente?.nome;
                          const pacienteId = (s as any).pacienteId ?? (s as any)?.paciente?.id;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              activeOpacity={0.9}
                              onPress={() => pacienteId && navigation.navigate('PatientDetail', { id: pacienteId, nome: pacienteNome })}
                            >
                              <Card style={{ flexDirection: 'row', padding: spacing(1.5), gap: spacing(1.5), alignItems:'center' }}>
                                 <View style={{ width: 4, height: 40, backgroundColor: s.status === 'completed' ? colors.success : colors.primary, borderRadius: 2 }} />
                                 <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={{ fontWeight: '700', fontSize: 16 }}>{pacienteNome || 'Paciente'}</Text>
                                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{hour} • {s.local || 'Consultório'}</Text>
                                 </View>
                                 {s.status !== 'completed' && (
                                   <TouchableOpacity 
                                     onPress={() => updSessaoMut.mutate({ id: s.id, status: 'completed' })}
                                     style={{ padding: 8 }}
                                   >
                                      <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.textMuted} />
                                   </TouchableOpacity>
                                 )}
                              </Card>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}