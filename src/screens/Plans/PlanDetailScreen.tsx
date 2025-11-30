import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlanoById, saveAtividades, updatePlano } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { typography, spacing, radius } from '../../theme/tokens';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { AtividadeDto, StatusPlano, TipoAtividade } from '../../types/dto';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

const TIPOS: TipoAtividade[] = [
  TipoAtividade.FORTALECIMENTO,
  TipoAtividade.ALONGAMENTO,
  TipoAtividade.AEROBICO,
  TipoAtividade.EQUILIBRIO,
  TipoAtividade.OUTRO,
];

const STATUS: StatusPlano[] = [
  StatusPlano.ATIVO,
  StatusPlano.CONCLUIDO,
  StatusPlano.CANCELADO,
];

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const qc = useQueryClient();

  const { data: plano, isLoading, isError, refetch } = useQuery({
    queryKey: ['plano', planId],
    queryFn: () => getPlanoById(planId),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AtividadeDto>({ nome: '', tipo: TipoAtividade.FORTALECIMENTO });
  const setCampo = (k: keyof AtividadeDto, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const atividades = useMemo(() => plano?.atividades ?? [], [plano]);

  const saveMut = useMutation({
    mutationFn: (ativs: AtividadeDto[]) => saveAtividades(planId, ativs),
    onSuccess: async () => {
      closeModal();
      await qc.invalidateQueries({ queryKey: ['plano', planId] });
      await qc.invalidateQueries({ queryKey: ['planos'] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message?.join?.('\n') ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao salvar alterações.';
      Alert.alert('Erro', msg);
    },
  });

  const updateStatus = useMutation({
    mutationFn: (s: StatusPlano) =>
      updatePlano(planId, { status: s }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['plano', planId] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message?.join?.('\n') ||
        err?.response?.data?.message ||
        err?.message ||
        'Falha ao atualizar status.';
      Alert.alert('Erro', String(msg));
    },
  });

  const closeModal = () => {
    setEditingIndex(null);
    setForm({ nome: '', tipo: TipoAtividade.FORTALECIMENTO });
    setModalVisible(false);
  }

  const onAddPress = () => {
    setEditingIndex(null);
    setForm({ nome: '', tipo: TipoAtividade.FORTALECIMENTO });
    setModalVisible(true);
  }

  const handleAdd = () => {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome da atividade.');
      return;
    }
    saveMut.mutate([...atividades, form]);
  };

  const handleEditStart = (idx: number) => {
    setEditingIndex(idx);
    setForm(atividades[idx]);
    setModalVisible(true);
  };

  const handleEditConfirm = () => {
    if (editingIndex === null) return;
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome da atividade.');
      return;
    }
    const atualizadas = atividades.map((a, i) => (i === editingIndex ? form : a));
    saveMut.mutate(atualizadas);
  };

  const handleRemove = (idx: number) => {
    Alert.alert('Remover atividade', 'Tem certeza que deseja remover esta atividade?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const novas = atividades.filter((_, i) => i !== idx);
          saveMut.mutate(novas);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (isError || !plano) {
    return (
      <View style={{ padding: spacing(2) }}>
        <Text style={{ fontWeight: '700', color: colors.danger }}>
          Erro ao carregar plano
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ textDecorationLine: 'underline', marginTop: spacing(1) }}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView
        edges={['top']}
        style={{
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(0.75), paddingBottom: spacing(1.5), gap: spacing(1.25) }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: spacing(1.5),
              paddingVertical: spacing(1),
              borderRadius: 999,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          <Text style={[typography.h1]} numberOfLines={2}>
            {plano.objetivoGeral}
          </Text>
          <Text style={typography.small} numberOfLines={3}>
            {plano.diagnosticoRelacionado}
          </Text>

          <View style={{ marginTop: spacing(0.75) }}>
            <StatusBadge
              status={plano.status}
            />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), marginTop: spacing(1) }}>
            {STATUS.map((s) => {
              const active = plano.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus.mutate(s)}
                  style={{
                    paddingHorizontal: spacing(1.5),
                    paddingVertical: spacing(1),
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.line,
                    borderRadius: 999,
                    backgroundColor: active ? colors.primary : colors.background,
                  }}
                >
                  <Text style={{ color: active ? colors.white : colors.text, fontWeight: '600', fontSize: 13 }}>
                    {`Marcar como ${s}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        <FlatList
          data={atividades}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing(2), gap: spacing(1.5), paddingBottom: spacing(4) }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
               <Text style={[typography.h2]}>Atividades</Text>
               <TouchableOpacity
                  onPress={onAddPress}
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
                  <Text style={{ color: colors.white, fontWeight: '700' }}>Adicionar</Text>
                </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', ...typography.small, marginTop: 20 }}>
              Nenhuma atividade cadastrada.
            </Text>
          }
          renderItem={({ item, index }) => (
            <Card>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1, gap: spacing(0.75) }}>
                  <Text style={typography.h3}>
                    {item.nome}
                    {item.tipo ? ` • ${item.tipo}` : ''}
                  </Text>
                  {!!item.descricao && <Text style={typography.body}>{item.descricao}</Text>}
                  <Text style={typography.small}>
                    {item.series ? `Séries: ${item.series}` : ''}
                    {item.repeticoes ? ` • Reps: ${item.repeticoes}` : ''}
                    {item.frequencia ? ` • ${item.frequencia}` : ''}
                  </Text>
                  {!!item.observacoes && (
                    <Text style={typography.small}>
                      Obs: {item.observacoes}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: spacing(1.5), marginLeft: spacing(1) }}>
                  <TouchableOpacity
                    onPress={() => handleEditStart(index)}
                    style={{
                      padding: spacing(1.25),
                      borderRadius: radius.md,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Feather name="edit-3" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(index)}
                    style={{
                      padding: spacing(1.25),
                      borderRadius: radius.md,
                      backgroundColor: '#FBEAEB',
                    }}
                  >
                    <Feather name="trash-2" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
         <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing(2) }}
        >
          <Card style={{ gap: spacing(1.25), maxHeight: '90%' }}>
            <ScrollView contentContainerStyle={{ gap: spacing(1.25) }}>
              <Text style={[typography.h2, { textAlign: 'center', marginBottom: spacing(1) }]}>
                {editingIndex === null ? 'Adicionar atividade' : 'Editar atividade'}
              </Text>

              <Input
                placeholder="Nome *"
                value={form.nome}
                onChangeText={(t) => setCampo('nome', t)}
              />
              <Input
                placeholder="Descrição"
                value={form.descricao || ''}
                onChangeText={(t) => setCampo('descricao', t)}
              />

              <View style={{ flexDirection: 'row', gap: spacing(1) }}>
                <Input
                  placeholder="Séries"
                  keyboardType="numeric"
                  value={form.series ? String(form.series) : ''}
                  onChangeText={(t) => setCampo('series', Number(t || 0))}
                  style={{ flex: 1 }}
                />
                <Input
                  placeholder="Repetições"
                  keyboardType="numeric"
                  value={form.repeticoes ? String(form.repeticoes) : ''}
                  onChangeText={(t) => setCampo('repeticoes', Number(t || 0))}
                  style={{ flex: 1 }}
                />
              </View>

              <Input
                placeholder="Frequência (ex.: 3x/semana)"
                value={form.frequencia || ''}
                onChangeText={(t) => setCampo('frequencia', t)}
              />
              <Input
                placeholder="Observações"
                value={form.observacoes || ''}
                onChangeText={(t) => setCampo('observacoes', t)}
              />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) }}>
                {TIPOS.map((t) => {
                  const active = form.tipo === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setCampo('tipo', t)}
                      style={{
                        paddingHorizontal: spacing(1.5),
                        paddingVertical: spacing(1),
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.line,
                        borderRadius: 999,
                        backgroundColor: active ? colors.primary : colors.background,
                      }}
                    >
                      <Text style={{ color: active ? colors.white : colors.text, fontWeight: '600' }}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing(1.25), marginTop: spacing(1) }}>
                 <Button
                    title={saveMut.isPending ? 'Salvando...' : (editingIndex === null ? 'Adicionar' : 'Salvar')}
                    onPress={editingIndex === null ? handleAdd : handleEditConfirm}
                    disabled={saveMut.isPending}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={closeModal}
                    style={{ flex: 1 }}
                  />
              </View>
            </ScrollView>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}