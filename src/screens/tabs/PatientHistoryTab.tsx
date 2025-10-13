import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PatientDetailTabParamList } from '../../navigation/types';

import type { RegistroDto } from '../../types/dto';
import {
  listRegistrosByPaciente,
  createRegistro,
  updateRegistro,
  deleteRegistro,
} from '../../services/api/registros';
import { listPlanosByPaciente } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

type Props = BottomTabScreenProps<PatientDetailTabParamList, 'History'>;

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

/** Chip estilizado (mesma linguagem visual do app) */
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.line,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : '#fff',
      }}
    >
      <Text style={{ color: active ? colors.white : colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Cabeçalho compacto para cada registro (data e hora) */
function whenCompact(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day} • ${t}`;
}

export default function PatientHistoryTab({ route }: Props) {
  const { id } = route.params; // pacienteId
  const qc = useQueryClient();

  // ===== Planos do paciente =====
  const planosQ = useQuery({
    queryKey: ['planos', id],
    queryFn: () => listPlanosByPaciente(id),
  });
  const planoLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    (planosQ.data || []).forEach((p) => (map[p.id] = p.objetivoGeral));
    return map;
  }, [planosQ.data]);

  // ===== Lista de registros =====
  const registrosQ = useQuery({
    queryKey: ['registros', id],
    queryFn: () => listRegistrosByPaciente(id),
  });

  // ===== Form criar/editar registro =====
  const [dataSessao, setDataSessao] = useState<Date | undefined>(undefined);
  const [escalaDor, setEscalaDor] = useState<number | undefined>(undefined); // 0..10
  const [percepEsforco, setPercepEsforco] = useState<number | undefined>(undefined); // 0..10
  const [conseguiuTudo, setConseguiuTudo] = useState<boolean | undefined>(undefined);
  const [notasSubj, setNotasSubj] = useState('');
  const [notasObj, setNotasObj] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [proxima, setProxima] = useState('');
  const [planoId, setPlanoId] = useState<string | null>(null);

  const [showDataIOS, setShowDataIOS] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: createRegistro,
    onSuccess: async () => {
      resetForm();
      await qc.invalidateQueries({ queryKey: ['registros', id] });
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message?.join?.('\n') ||
        e?.response?.data?.message ||
        e?.message ||
        'Falha ao salvar registro';
      Alert.alert('Erro', String(msg));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      registroId,
      dto,
    }: {
      registroId: string;
      dto: Partial<RegistroDto> & { planoId?: string };
    }) => updateRegistro(registroId, dto),
    onSuccess: async () => {
      resetForm();
      await qc.invalidateQueries({ queryKey: ['registros', id] });
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message?.join?.('\n') ||
        e?.response?.data?.message ||
        e?.message ||
        'Falha ao atualizar registro';
      Alert.alert('Erro', String(msg));
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteRegistro,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['registros', id] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao remover registro';
      Alert.alert('Erro', String(msg));
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setDataSessao(undefined);
    setEscalaDor(undefined);
    setPercepEsforco(undefined);
    setConseguiuTudo(undefined);
    setNotasSubj('');
    setNotasObj('');
    setAvaliacao('');
    setProxima('');
    setPlanoId(null);
  };

  const toISO = (d?: Date) => (d ? d.toISOString() : undefined);

  const onSalvar = () => {
    if (!planoId) {
      Alert.alert('Atenção', 'Selecione um plano.');
      return;
    }
    const dto = {
      pacienteId: id,
      planoId,
      dataSessao: toISO(dataSessao),
      escalaDor: typeof escalaDor === 'number' ? escalaDor : undefined,
      percepcaoEsforco: typeof percepEsforco === 'number' ? percepEsforco : undefined,
      conseguiuRealizarTudo: typeof conseguiuTudo === 'boolean' ? conseguiuTudo : undefined,
      notasSubjetivas: notasSubj || undefined,
      notasObjetivas: notasObj || undefined,
      avaliacao: avaliacao || undefined,
      planoProximaSessao: proxima || undefined,
    };

    if (editingId) {
      updateMut.mutate({ registroId: editingId, dto });
    } else {
      createMut.mutate(dto);
    }
  };

  const onEditar = (r: RegistroDto) => {
    setEditingId(r.id);
    setDataSessao(r.dataSessao ? new Date(r.dataSessao) : undefined);
    setEscalaDor(typeof r.escalaDor === 'number' ? r.escalaDor : undefined);
    setPercepEsforco(typeof r.percepcaoEsforco === 'number' ? r.percepcaoEsforco : undefined);
    setConseguiuTudo(
      typeof r.conseguiuRealizarTudo === 'boolean' ? r.conseguiuRealizarTudo : undefined
    );
    setNotasSubj(r.notasSubjetivas || '');
    setNotasObj(r.notasObjetivas || '');
    setAvaliacao(r.avaliacao || '');
    setProxima(r.planoProximaSessao || '');
    setPlanoId(r.planoId);
  };

  const onRemover = (idRegistro: string) => {
    Alert.alert('Remover registro', 'Tem certeza que deseja remover este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMut.mutate(idRegistro) },
    ]);
  };

  // ===== Header fixo (mais colado ao topo do paciente) =====
  const HeaderBar = (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <Text style={[typography.h1]}>Histórico</Text>
      <Text style={{ ...typography.muted, marginTop: 2 }}>
        Registre evolução e observações de cada sessão
      </Text>
    </View>
  );

  // ===== Form como HEADER da lista =====
  const FormHeader = (
    <Card style={{ gap: 12, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name="book-open" size={18} color={colors.text} />
        <Text style={[typography.h2]}>{editingId ? 'Editar registro' : 'Novo registro'}</Text>
      </View>

      {/* Data da sessão */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>Data da sessão</Text>
        <Button
          title={formatDateTime(dataSessao)}
          variant="outline"
          onPress={() => {
            if (Platform.OS === 'android') {
              pickDateTimeAndroid(dataSessao, setDataSessao);
            } else {
              setShowDataIOS(true);
            }
          }}
        />
        {Platform.OS === 'ios' && showDataIOS && (
          <View style={{ marginTop: 8 }}>
            <DateTimePicker
              value={dataSessao || new Date()}
              mode="datetime"
              display="inline"
              onChange={(_e, d) => d && setDataSessao(d)}
            />
            <View style={{ marginTop: 8 }}>
              <Button title="Concluir" onPress={() => setShowDataIOS(false)} />
            </View>
          </View>
        )}
      </View>

      {/* Plano (chips) */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Plano</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(planosQ.data || []).map((pl) => (
            <Chip
              key={pl.id}
              label={pl.objetivoGeral}
              active={planoId === pl.id}
              onPress={() => setPlanoId(pl.id)}
            />
          ))}
        </View>
        {!planoId && !!(planosQ.data || []).length && (
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Selecione um plano.</Text>
        )}
        {!(planosQ.data || []).length && (
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Nenhum plano para este paciente.
          </Text>
        )}
      </View>

      {/* Escalas (sliders 0–10) */}
      <View style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontWeight: '600' }}>Escala de dor (0–10)</Text>
            <Text style={{ color: colors.textMuted }}>
              {typeof escalaDor === 'number' ? escalaDor : '—'}
            </Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={typeof escalaDor === 'number' ? escalaDor : 0}
            onValueChange={(v) => setEscalaDor(v)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.line}
            style={{ height: 44 }} // deixa “alto” o suficiente
          />
        </View>

        <View style={{ gap: 6 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontWeight: '600' }}>Percepção de esforço (0–10)</Text>
            <Text style={{ color: colors.textMuted }}>
              {typeof percepEsforco === 'number' ? percepEsforco : '—'}
            </Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={typeof percepEsforco === 'number' ? percepEsforco : 0}
            onValueChange={(v) => setPercepEsforco(v)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.line}
            style={{ height: 44 }}
          />
        </View>
      </View>

      {/* Conseguiu realizar tudo (chips) */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>Conseguiu realizar tudo?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Sim" active={conseguiuTudo === true} onPress={() => setConseguiuTudo(true)} />
          <Chip
            label="Não"
            active={conseguiuTudo === false}
            onPress={() => setConseguiuTudo(false)}
          />
        </View>
      </View>

      {/* Textos */}
      <Input placeholder="Notas subjetivas" value={notasSubj} onChangeText={setNotasSubj} />
      <Input placeholder="Notas objetivas" value={notasObj} onChangeText={setNotasObj} />
      <Input placeholder="Avaliação" value={avaliacao} onChangeText={setAvaliacao} />
      <Input
        placeholder="Plano para próxima sessão"
        value={proxima}
        onChangeText={setProxima}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title={
            (editingId ? updateMut.isPending : createMut.isPending)
              ? 'Salvando...'
              : editingId
              ? 'Salvar edição'
              : 'Adicionar registro'
          }
          onPress={onSalvar}
          disabled={createMut.isPending || updateMut.isPending}
          style={{ paddingVertical: 12 }}
        />
        {editingId && (
          <Button title="Cancelar" variant="outline" onPress={resetForm} style={{ paddingVertical: 12 }} />
        )}
      </View>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {HeaderBar}

      <FlatList
        data={registrosQ.data || []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        ListHeaderComponent={FormHeader}
        refreshControl={
          <RefreshControl
            refreshing={!!registrosQ.isRefetching || registrosQ.isLoading}
            onRefresh={registrosQ.refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !registrosQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <Feather name="book" size={20} color={colors.textMuted} />
              <Text style={[typography.h2]}>Sem registros</Text>
              <Text style={{ ...typography.muted, textAlign: 'center' }}>
                Use o formulário acima para adicionar o primeiro registro deste paciente.
              </Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => {
          const quando = whenCompact(item.dataSessao);
          const planoNome = planoLabelById[item.planoId] || item.planoId;

          return (
            <Card style={{ padding: 12, gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h2]} numberOfLines={1}>
                    {quando}
                  </Text>
                  <Text style={{ ...typography.muted }} numberOfLines={1}>
                    Plano: {planoNome}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => onEditar(item)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: '#EFE8DB',
                    }}
                  >
                    <Feather name="edit-3" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRemover(item.id)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: '#FAE4E1',
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#A33" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Indicadores rápidos */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {typeof item.escalaDor === 'number' && (
                  <Chip label={`Dor: ${item.escalaDor}/10`} />
                )}
                {typeof item.percepcaoEsforco === 'number' && (
                  <Chip label={`Esforço: ${item.percepcaoEsforco}/10`} />
                )}
                {typeof item.conseguiuRealizarTudo === 'boolean' && (
                  <Chip label={item.conseguiuRealizarTudo ? 'Conseguiu' : 'Não conseguiu'} />
                )}
              </View>

              {/* Textos (mostra só se houver) */}
              {!!item.notasSubjetivas && <Text>Notas subjetivas: {item.notasSubjetivas}</Text>}
              {!!item.notasObjetivas && <Text>Notas objetivas: {item.notasObjetivas}</Text>}
              {!!item.avaliacao && <Text>Avaliação: {item.avaliacao}</Text>}
              {!!item.planoProximaSessao && (
                <Text>Próxima sessão: {item.planoProximaSessao}</Text>
              )}
            </Card>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}
