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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRegistrosByPaciente, createRegistro, updateRegistro, deleteRegistro } from '../../services/api/registros';
import { listPlanosByPaciente } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PatientDetailTabParamList } from '../../navigation/types';
import type { RegistroDto } from '../../types/dto';

type Props = BottomTabScreenProps<PatientDetailTabParamList, 'History'>;

const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
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

function formatDate(d?: Date) {
  if (!d) return 'Selecionar...';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function when(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} • ${time}`;
}

export default function PatientHistoryTab({ route }: Props) {
  const { id } = route.params;
  const qc = useQueryClient();

  const planosQ = useQuery({
    queryKey: ['planos', id],
    queryFn: () => listPlanosByPaciente(id),
  });

  const planos = useMemo(() => {
    const map: Record<string, string> = {};
    (planosQ.data || []).forEach((p) => (map[p.id] = p.objetivoGeral));
    return map;
  }, [planosQ.data]);

  const registrosQ = useQuery({
    queryKey: ['registros', id],
    queryFn: () => listRegistrosByPaciente(id),
  });

  const [dataSessao, setDataSessao] = useState<Date>();
  const [escalaDor, setEscalaDor] = useState<number>();
  const [percepEsforco, setPercepEsforco] = useState<number>();
  const [conseguiuTudo, setConseguiuTudo] = useState<boolean>();
  const [notasSubj, setNotasSubj] = useState('');
  const [notasObj, setNotasObj] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [proxima, setProxima] = useState('');
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDataIOS, setShowDataIOS] = useState(false);

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

  const createMut = useMutation({
    mutationFn: createRegistro,
    onSuccess: async () => {
      resetForm();
      await qc.invalidateQueries({ queryKey: ['registros', id] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Falha ao salvar registro.';
      Alert.alert('Erro', msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ registroId, dto }: { registroId: string; dto: Partial<RegistroDto> }) =>
      updateRegistro(registroId, dto),
    onSuccess: async () => {
      resetForm();
      await qc.invalidateQueries({ queryKey: ['registros', id] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteRegistro,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['registros', id] }),
  });

  const handleSave = () => {
    if (!planoId) {
      Alert.alert('Atenção', 'Selecione um plano.');
      return;
    }

    const dto = {
      pacienteId: id,
      planoId,
      dataSessao: toISO(dataSessao),
      escalaDor,
      percepEsforco,
      conseguiuRealizarTudo: conseguiuTudo,
      notasSubjetivas: notasSubj || undefined,
      notasObjetivas: notasObj || undefined,
      avaliacao: avaliacao || undefined,
      planoProximaSessao: proxima || undefined,
    };

    editingId ? updateMut.mutate({ registroId: editingId, dto }) : createMut.mutate(dto);
  };

  const handleEdit = (r: RegistroDto) => {
    setEditingId(r.id);
    setDataSessao(r.dataSessao ? new Date(r.dataSessao) : undefined);
    setEscalaDor(r.escalaDor);
    setPercepEsforco(r.percepcaoEsforco);
    setConseguiuTudo(r.conseguiuRealizarTudo);
    setNotasSubj(r.notasSubjetivas || '');
    setNotasObj(r.notasObjetivas || '');
    setAvaliacao(r.avaliacao || '');
    setProxima(r.planoProximaSessao || '');
    setPlanoId(r.planoId);
  };

  const handleDelete = (idRegistro: string) => {
    Alert.alert('Remover registro', 'Deseja realmente excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMut.mutate(idRegistro) },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <Text style={[typography.h1]}>Histórico</Text>
        <Text style={{ ...typography.muted, marginTop: 2 }}>
          Acompanhe a evolução e os registros do paciente.
        </Text>
      </View>

      <FlatList
        data={registrosQ.data || []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        ListHeaderComponent={
          <Card style={{ gap: 12 }}>
            <Text style={[typography.h2]}>{editingId ? 'Editar registro' : 'Novo registro'}</Text>

            <Button
              title={formatDate(dataSessao)}
              variant="outline"
              onPress={() => {
                if (Platform.OS === 'android') {
                  DateTimePickerAndroid.open({
                    value: dataSessao || new Date(),
                    mode: 'date',
                    onChange: (_, d) => d && setDataSessao(d),
                  });
                } else {
                  setShowDataIOS(true);
                }
              }}
            />

            {Platform.OS === 'ios' && showDataIOS && (
              <View>
                <DateTimePicker
                  value={dataSessao || new Date()}
                  mode="datetime"
                  display="inline"
                  onChange={(_, d) => d && setDataSessao(d)}
                />
                <Button title="Concluir" onPress={() => setShowDataIOS(false)} />
              </View>
            )}

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

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>Escala de dor</Text>
              <Slider
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={escalaDor ?? 0}
                onValueChange={setEscalaDor}
                minimumTrackTintColor={colors.primary}
              />
            </View>

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>Percepção de esforço</Text>
              <Slider
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={percepEsforco ?? 0}
                onValueChange={setPercepEsforco}
                minimumTrackTintColor={colors.primary}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Sim" active={conseguiuTudo === true} onPress={() => setConseguiuTudo(true)} />
              <Chip label="Não" active={conseguiuTudo === false} onPress={() => setConseguiuTudo(false)} />
            </View>

            <Input placeholder="Notas subjetivas" value={notasSubj} onChangeText={setNotasSubj} />
            <Input placeholder="Notas objetivas" value={notasObj} onChangeText={setNotasObj} />
            <Input placeholder="Avaliação" value={avaliacao} onChangeText={setAvaliacao} />
            <Input placeholder="Plano para próxima sessão" value={proxima} onChangeText={setProxima} />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                title={editingId ? 'Salvar edição' : 'Adicionar registro'}
                onPress={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
              />
              {editingId && <Button title="Cancelar" variant="outline" onPress={resetForm} />}
            </View>
          </Card>
        }
        refreshControl={
          <RefreshControl
            refreshing={!!registrosQ.isRefetching || registrosQ.isLoading}
            onRefresh={registrosQ.refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[typography.h2]}>{when(item.dataSessao)}</Text>
                <Text style={typography.muted}>Plano: {planos[item.planoId] || item.planoId}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  style={{ padding: 8, backgroundColor: '#EFE8DB', borderRadius: 8 }}
                >
                  <Feather name="edit-3" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{ padding: 8, backgroundColor: '#FAE4E1', borderRadius: 8 }}
                >
                  <Feather name="trash-2" size={18} color="#A33" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </KeyboardAvoidingView>
  );
}
