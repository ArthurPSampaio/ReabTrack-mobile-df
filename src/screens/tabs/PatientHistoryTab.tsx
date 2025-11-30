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
  Modal,
  ScrollView,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRegistrosByPaciente, createRegistro, updateRegistro, deleteRegistro } from '../../services/api/registros';
import { listPlanosByPaciente } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { typography, spacing, radius } from '../../theme/tokens';
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

  const [modalVisible, setModalVisible] = useState(false);
  const [dataSessao, setDataSessao] = useState<Date>();
  const [escalaDor, setEscalaDor] = useState<number>();
  const [percepcaoEsforco, setPercepcaoEsforco] = useState<number>();
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
    setPercepcaoEsforco(undefined);
    setConseguiuTudo(undefined);
    setNotasSubj('');
    setNotasObj('');
    setAvaliacao('');
    setProxima('');
    setPlanoId(null);
    setModalVisible(false);
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
      percepcaoEsforco,
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
    setPercepcaoEsforco(r.percepcaoEsforco);
    setConseguiuTudo(r.conseguiuRealizarTudo);
    setNotasSubj(r.notasSubjetivas || '');
    setNotasObj(r.notasObjetivas || '');
    setAvaliacao(r.avaliacao || '');
    setProxima(r.planoProximaSessao || '');
    setPlanoId(r.planoId);
    setModalVisible(true);
  };

  const onNew = () => {
    resetForm(); // reseta e limpa o editingId
    setModalVisible(true); // abre o modal vazio
  }

  const handleDelete = (idRegistro: string) => {
    Alert.alert('Remover registro', 'Deseja realmente excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMut.mutate(idRegistro) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingHorizontal: spacing(2),
          paddingVertical: spacing(1.5),
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          backgroundColor: colors.background,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={[typography.h1]}>Histórico</Text>
        <TouchableOpacity
          onPress={onNew}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.md,
          }}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '700' }}>Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={registrosQ.data || []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing(2), gap: spacing(1.25) }}
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
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3]}>{when(item.dataSessao)}</Text>
                <Text style={typography.small}>Plano: {planos[item.planoId] || item.planoId}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing(1) }}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  style={{ padding: spacing(1), backgroundColor: colors.surface, borderRadius: radius.md }}
                >
                  <Feather name="edit-3" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{ padding: spacing(1), backgroundColor: '#FBEAEB', borderRadius: radius.md }}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing(2) }}
        >
          <Card style={{ gap: spacing(1.5), maxHeight: '90%' }}>
            <ScrollView contentContainerStyle={{ gap: spacing(1.25) }}>
              <Text style={[typography.h2, { textAlign: 'center' }]}>
                {editingId ? 'Editar registro' : 'Novo registro'}
              </Text>

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

              <View style={{ gap: spacing(1) }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>Plano Associado</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) }}>
                  {(planosQ.data || []).map((pl) => (
                    <Chip
                      key={pl.id}
                      label={pl.objetivoGeral}
                      active={planoId === pl.id}
                      onPress={() => setPlanoId(pl.id)}
                    />
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontWeight: '600', marginBottom: spacing(0.75), color: colors.text }}>Escala de dor: {escalaDor ?? 0}/10</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={escalaDor ?? 0}
                  onValueChange={setEscalaDor}
                  minimumTrackTintColor={colors.primary}
                  thumbTintColor={colors.primary}
                />
              </View>

              <View>
                <Text style={{ fontWeight: '600', marginBottom: spacing(0.75), color: colors.text }}>Percepção de esforço: {percepcaoEsforco ?? 0}/10</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={percepcaoEsforco ?? 0}
                  onValueChange={setPercepcaoEsforco}
                  minimumTrackTintColor={colors.primary}
                  thumbTintColor={colors.primary}
                />
              </View>

              <View style={{ gap: spacing(1) }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>Conseguiu realizar tudo?</Text>
                <View style={{ flexDirection: 'row', gap: spacing(1) }}>
                  <Chip label="Sim" active={conseguiuTudo === true} onPress={() => setConseguiuTudo(true)} />
                  <Chip label="Não" active={conseguiuTudo === false} onPress={() => setConseguiuTudo(false)} />
                </View>
              </View>

              <Input placeholder="Notas subjetivas (S)" value={notasSubj} onChangeText={setNotasSubj} multiline />
              <Input placeholder="Notas objetivas (O)" value={notasObj} onChangeText={setNotasObj} multiline />
              <Input placeholder="Avaliação (A)" value={avaliacao} onChangeText={setAvaliacao} multiline />
              <Input placeholder="Plano para próxima sessão (P)" value={proxima} onChangeText={setProxima} multiline />

              <View style={{ flexDirection: 'row', gap: spacing(1.25) }}>
                <Button
                  title={editingId ? 'Salvar' : 'Adicionar'}
                  onPress={handleSave}
                  disabled={createMut.isPending || updateMut.isPending}
                  style={{ flex: 1 }}
                />
                <Button title="Cancelar" variant="outline" onPress={resetForm} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}