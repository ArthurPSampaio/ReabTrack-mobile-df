import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  RootStackParamList,
  PatientDetailTabParamList,
} from '../../navigation/types';

import type { SessaoDto, StatusSessao } from '../../types/dto';
import {
  listAgenda,
  createSessao,
  updateSessao,
  deleteSessao,
} from '../../services/api/agenda';
import { listPlanosByPaciente } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientDetailTabParamList, 'Sessions'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS: StatusSessao[] = ['scheduled', 'completed', 'canceled', 'no_show'];

function formatDateTime(d?: Date) {
  if (!d) return 'Selecionar...';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

async function pickDateTimeAndroid(
  current: Date | undefined,
  onPicked: (finalDate: Date) => void
) {
  const base = current ?? new Date();
  DateTimePickerAndroid.open({
    value: base,
    mode: 'date',
    onChange: (e: DateTimePickerEvent, d?: Date) => {
      if (e.type === 'dismissed' || !d) return;
      const pickedDate = new Date(d);
      DateTimePickerAndroid.open({
        value: base,
        mode: 'time',
        is24Hour: true,
        onChange: (e2: DateTimePickerEvent, t?: Date) => {
          if (e2.type === 'dismissed' || !t) return;
          const final = new Date(
            pickedDate.getFullYear(),
            pickedDate.getMonth(),
            pickedDate.getDate(),
            t.getHours(),
            t.getMinutes(),
            0,
            0
          );
          onPicked(final);
        },
      });
    },
  });
}

export default function PatientSessionsTab({ route }: Props) {
  const { id } = route.params;
  const qc = useQueryClient();

  const planosQ = useQuery({
    queryKey: ['planos', id],
    queryFn: () => listPlanosByPaciente(id),
  });

  const sessoesQ = useQuery({
    queryKey: ['agenda', id],
    queryFn: () => listAgenda({ pacienteId: id }),
  });

  const [inicio, setInicio] = useState<Date | undefined>(undefined);
  const [fim, setFim] = useState<Date | undefined>(undefined);
  const [showInicioIOS, setShowInicioIOS] = useState(false);
  const [showFimIOS, setShowFimIOS] = useState(false);
  const [local, setLocal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [planoId, setPlanoId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: createSessao,
    onSuccess: async () => {
      setInicio(undefined);
      setFim(undefined);
      setLocal('');
      setObservacoes('');
      await qc.invalidateQueries({ queryKey: ['agenda', id] });
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message?.join?.('\n') ||
        e?.response?.data?.message ||
        e?.message ||
        'Falha ao agendar';
      Alert.alert('Erro', String(msg));
    },
  });

  const toISO = (d: Date) => d.toISOString();

  const onAgendar = () => {
    if (!inicio || !fim || !planoId) {
      Alert.alert('Atenção', 'Escolha início, fim e selecione um plano.');
      return;
    }
    if (inicio >= fim) {
      Alert.alert('Atenção', 'O horário de término deve ser após o início.');
      return;
    }
    createMut.mutate({
      inicio: toISO(inicio),
      fim: toISO(fim),
      pacienteId: id,
      planoId,
      local: local || undefined,
      observacoes: observacoes || undefined,
    });
  };

  const updateMut = useMutation({
    mutationFn: ({
      sessaoId,
      dto,
    }: {
      sessaoId: string;
      dto: Partial<SessaoDto> & { status?: StatusSessao };
    }) => updateSessao(sessaoId, dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['agenda', id] });
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message?.join?.('\n') ||
        e?.response?.data?.message ||
        e?.message ||
        'Falha ao atualizar sessão';
      Alert.alert('Erro', String(msg));
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteSessao,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['agenda', id] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao remover sessão';
      Alert.alert('Erro', String(msg));
    },
  });

  const onRemover = (sessaoId: string) => {
    Alert.alert('Remover', 'Deseja remover esta sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMut.mutate(sessaoId) },
    ]);
  };

  const ListHeader = (
    <View style={{ gap: 12 }}>
      <View
        style={{
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <Text style={[typography.h1]}>Sessões</Text>
      </View>

      <Card style={{ gap: 10 }}>
        <Text style={[typography.h2]}>Agendar sessão</Text>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '600' }}>Início</Text>
          <Button
            title={formatDateTime(inicio)}
            variant="outline"
            onPress={() => {
              if (Platform.OS === 'android') {
                pickDateTimeAndroid(inicio, setInicio);
              } else {
                setShowInicioIOS(true);
              }
            }}
          />
          {Platform.OS === 'ios' && showInicioIOS && (
            <View style={{ marginTop: 8 }}>
              <DateTimePicker
                value={inicio || new Date()}
                mode="datetime"
                display="inline"
                onChange={(_e, d) => d && setInicio(d)}
              />
              <View style={{ marginTop: 8 }}>
                <Button title="Concluir" onPress={() => setShowInicioIOS(false)} />
              </View>
            </View>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '600' }}>Fim</Text>
          <Button
            title={formatDateTime(fim)}
            variant="outline"
            onPress={() => {
              if (Platform.OS === 'android') {
                pickDateTimeAndroid(
                  fim ?? (inicio ? new Date(inicio.getTime() + 60 * 60 * 1000) : undefined),
                  setFim
                );
              } else {
                setShowFimIOS(true);
              }
            }}
          />
          {Platform.OS === 'ios' && showFimIOS && (
            <View style={{ marginTop: 8 }}>
              <DateTimePicker
                value={fim || (inicio ? new Date(inicio.getTime() + 60 * 60 * 1000) : new Date())}
                mode="datetime"
                display="inline"
                onChange={(_e, d) => d && setFim(d)}
              />
              <View style={{ marginTop: 8 }}>
                <Button title="Concluir" onPress={() => setShowFimIOS(false)} />
              </View>
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Plano</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(planosQ.data || []).map((pl) => {
              const active = planoId === pl.id;
              return (
                <TouchableOpacity
                  key={pl.id}
                  activeOpacity={0.9}
                  onPress={() => setPlanoId(pl.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.line,
                    borderRadius: 999,
                    backgroundColor: active ? colors.primary : '#fff',
                  }}
                >
                  <Text style={{ color: active ? '#fff' : colors.text }}>
                    {pl.objetivoGeral}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!planoId && !!(planosQ.data || []).length && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Selecione um plano.</Text>
          )}
          {!(planosQ.data || []).length && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Nenhum plano encontrado para este paciente.
            </Text>
          )}
        </View>

        <Input placeholder="Local (opcional)" value={local} onChangeText={setLocal} />
        <Input
          placeholder="Observações (opcional)"
          value={observacoes}
          onChangeText={setObservacoes}
        />

        <Button
          title={createMut.isPending ? 'Agendando...' : 'Agendar'}
          onPress={onAgendar}
          disabled={createMut.isPending}
        />
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <FlatList
        data={sessoesQ.data || []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12, paddingTop: 16 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={!!sessoesQ.isRefetching || sessoesQ.isLoading}
            onRefresh={sessoesQ.refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !sessoesQ.isLoading ? (
            <Text style={{ textAlign: 'center', color: colors.textMuted }}>
              Nenhuma sessão para este paciente.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const inicioDt = new Date(item.inicio);
          const fimDt = new Date(item.fim);
          const horario =
            isNaN(inicioDt.getTime()) || isNaN(fimDt.getTime())
              ? `${item.inicio} → ${item.fim}`
              : `${inicioDt.toLocaleString()} → ${fimDt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`;

          return (
            <Card>
              <Text style={[typography.h2]}>{horario}</Text>
              <Text style={typography.muted}>{item.local || 'Sem local'}</Text>
              {!!item.observacoes && <Text style={{ marginTop: 6 }}>{item.observacoes}</Text>}

              <View
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '700' }}>Status:</Text>
                {STATUS.map((s) => {
                  const labelMap: Record<StatusSessao, string> = {
                    scheduled: 'Agendada',
                    completed: 'Concluída',
                    canceled: 'Cancelada',
                    no_show: 'Faltou',
                  };
                  const active = item.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.9}
                      onPress={() => updateMut.mutate({ sessaoId: item.id, dto: { status: s } })}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.line,
                        borderRadius: 999,
                        backgroundColor: active ? colors.primary : '#fff',
                      }}
                    >
                      <Text style={{ color: active ? '#fff' : colors.text }}>{labelMap[s]}</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ flex: 1 }} />
                <Button title="Remover" variant="outline" onPress={() => onRemover(item.id)} />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
