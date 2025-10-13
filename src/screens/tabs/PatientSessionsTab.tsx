import React, { useState, useMemo } from 'react';
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
import { Feather } from '@expo/vector-icons';
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

const STATUS_LABEL: Record<StatusSessao, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  canceled: 'Cancelada',
  no_show: 'Faltou',
};

function formatDateTime(d?: Date) {
  if (!d) return 'Selecionar...';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

// Android: primeiro data, depois hora
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
      const picked = new Date(d);
      DateTimePickerAndroid.open({
        value: base,
        mode: 'time',
        is24Hour: true,
        onChange: (e2: DateTimePickerEvent, t?: Date) => {
          if (e2.type === 'dismissed' || !t) return;
          const final = new Date(
            picked.getFullYear(),
            picked.getMonth(),
            picked.getDate(),
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

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.line,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : '#fff',
      }}
    >
      <Text style={{ color: active ? colors.white : colors.text, fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function compactRange(inicio: string, fim: string) {
  const si = new Date(inicio);
  const sf = new Date(fim);
  if (isNaN(si.getTime()) || isNaN(sf.getTime())) return `${inicio} → ${fim}`;
  const sameDay =
    si.getFullYear() === sf.getFullYear() &&
    si.getMonth() === sf.getMonth() &&
    si.getDate() === sf.getDate();

  const day = si.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
  const t1 = si.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const t2 = sf.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `${day.toUpperCase()} • ${t1}–${t2}` : `${day.toUpperCase()} ${t1} → ${t2}`;
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

  // ===== Form nova sessão =====
  const [inicio, setInicio] = useState<Date | undefined>();
  const [fim, setFim] = useState<Date | undefined>();
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

  // ===== Ações por sessão =====
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

  const totalSessoes = useMemo(() => (sessoesQ.data || []).length, [sessoesQ.data]);

  // ===== Header + Form (com menos espaço antes do título) =====
  const ListHeader = (
    <View style={{ gap: 10 }}>
      {/* Título próximo do header do paciente */}
      <View
        style={{
          paddingTop: 4,            // <-- reduzido
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <Text style={[typography.h1]}>Sessões</Text>
        <Text style={{ ...typography.muted, marginTop: 2 }}>
          {totalSessoes > 0
            ? `${totalSessoes} ${totalSessoes === 1 ? 'sessão' : 'sessões'} deste paciente`
            : 'Nenhuma sessão cadastrada ainda'}
        </Text>
      </View>

      {/* Agendar nova sessão (mais compacto) */}
      <Card style={{ gap: 10, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="calendar" size={18} color={colors.text} />
          <Text style={[typography.h2]}>Agendar sessão</Text>
        </View>

        {/* Início */}
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
            style={{ paddingVertical: 10 }}
          />
          {Platform.OS === 'ios' && showInicioIOS && (
            <View style={{ marginTop: 6 }}>
              <DateTimePicker
                value={inicio || new Date()}
                mode="datetime"
                display="inline"
                onChange={(_e, d) => d && setInicio(d)}
              />
              <View style={{ marginTop: 6 }}>
                <Button title="Concluir" onPress={() => setShowInicioIOS(false)} />
              </View>
            </View>
          )}
        </View>

        {/* Fim */}
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
            style={{ paddingVertical: 10 }}
          />
          {Platform.OS === 'ios' && showFimIOS && (
            <View style={{ marginTop: 6 }}>
              <DateTimePicker
                value={fim || (inicio ? new Date(inicio.getTime() + 60 * 60 * 1000) : new Date())}
                mode="datetime"
                display="inline"
                onChange={(_e, d) => d && setFim(d)}
              />
              <View style={{ marginTop: 6 }}>
                <Button title="Concluir" onPress={() => setShowFimIOS(false)} />
              </View>
            </View>
          )}
        </View>

        {/* Plano (chips) */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '600' }}>Plano</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(planosQ.data || []).map((pl) => {
              const active = planoId === pl.id;
              return (
                <Chip
                  key={pl.id}
                  label={pl.objetivoGeral}
                  active={active}
                  onPress={() => setPlanoId(pl.id)}
                />
              );
            })}
          </View>
          {!planoId && !!(planosQ.data || []).length && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Selecione um plano.
            </Text>
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
          style={{ paddingVertical: 12 }}
        />
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <FlatList
        data={sessoesQ.data || []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,  // <-- menor que antes
          paddingBottom: 24,
          gap: 10,
        }}
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
            <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <Feather name="calendar" size={20} color={colors.textMuted} />
              <Text style={[typography.h2]}>Sem sessões ainda</Text>
              <Text style={{ ...typography.muted, textAlign: 'center' }}>
                Agende a primeira sessão usando o formulário acima.
              </Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => {
          const when = compactRange(item.inicio, item.fim);

          return (
            <Card style={{ padding: 12, gap: 8 }}>
              {/* Linha principal: horário + status atual em destaque */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h2]} numberOfLines={1}>{when}</Text>
                  <Text style={{ ...typography.muted }} numberOfLines={1}>
                    {item.local || 'Sem local'}
                  </Text>
                </View>
                <Chip label={STATUS_LABEL[item.status]} active />
              </View>

              {/* Observações (se houver) */}
              {!!item.observacoes && (
                <Text numberOfLines={2} style={{ color: colors.text, marginTop: 2 }}>
                  {item.observacoes}
                </Text>
              )}

              {/* Ações enxutas: chips de mudança + remover */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                {STATUS.map((s) => {
                  const active = item.status === s;
                  return (
                    <Chip
                      key={s}
                      label={STATUS_LABEL[s]}
                      active={active}
                      onPress={() =>
                        updateMut.mutate({ sessaoId: item.id, dto: { status: s } })
                      }
                    />
                  );
                })}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => onRemover(item.id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: '#FAE4E1',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Feather name="trash-2" size={18} color="#A33" />
                  <Text style={{ color: '#A33', fontWeight: '700' }}>Remover</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
