import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlanoById, saveAtividades, updatePlano } from '../../services/api/plans';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { AtividadeDto, TipoAtividade } from '../../types/dto';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

const TIPOS: TipoAtividade[] = [
  'Fortalecimento',
  'Alongamento',
  'Aeróbico',
  'Equilíbrio',
  'Outro',
];

const STATUS = ['Ativo', 'Concluído', 'Cancelado'] as const;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const qc = useQueryClient();

  const { data: plano, isLoading, isError, refetch } = useQuery({
    queryKey: ['plano', planId],
    queryFn: () => getPlanoById(planId),
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AtividadeDto>({ nome: '', tipo: 'Fortalecimento' });
  const setCampo = (k: keyof AtividadeDto, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const atividades = useMemo(() => plano?.atividades ?? [], [plano]);

  const saveMut = useMutation({
    mutationFn: (ativs: AtividadeDto[]) => saveAtividades(planId, ativs),
    onSuccess: async () => {
      setForm({ nome: '', tipo: 'Fortalecimento' });
      setEditingIndex(null);
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
    mutationFn: (s: 'Ativo' | 'Concluído' | 'Cancelado') =>
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
      Alert.alert('Erro', msg);
    },
  });

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
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: '700', color: colors.danger }}>
          Erro ao carregar plano
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ textDecorationLine: 'underline', marginTop: 8 }}>
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
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: '#EFE8DB',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          <Text style={[typography.h1]} numberOfLines={2}>
            {plano.objetivoGeral}
          </Text>
          <Text style={typography.muted} numberOfLines={3}>
            {plano.diagnosticoRelacionado}
          </Text>

          <View style={{ marginTop: 6 }}>
            <StatusBadge
              status={plano.status as 'Ativo' | 'Concluído' | 'Cancelado'}
            />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {STATUS.map((s) => {
              const active = plano.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus.mutate(s)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.line,
                    borderRadius: 999,
                    backgroundColor: active ? colors.primary : '#fff',
                  }}
                >
                  <Text style={{ color: active ? colors.white : colors.text }}>
                    {`Marcar como ${s}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={atividades}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        ListHeaderComponent={
          <Card style={{ gap: 10, marginBottom: 12 }}>
            <Text style={[typography.h2]}>
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

            <View style={{ flexDirection: 'row', gap: 8 }}>
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

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TIPOS.map((t) => {
                const active = form.tipo === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setCampo('tipo', t)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.line,
                      borderRadius: 999,
                      backgroundColor: active ? colors.primary : '#fff',
                    }}
                  >
                    <Text style={{ color: active ? colors.white : colors.text }}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {editingIndex === null ? (
              <Button
                title={saveMut.isPending ? 'Adicionando...' : 'Adicionar atividade'}
                onPress={handleAdd}
                disabled={saveMut.isPending}
              />
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title={saveMut.isPending ? 'Salvando...' : 'Salvar edição'}
                  onPress={handleEditConfirm}
                  disabled={saveMut.isPending}
                />
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => {
                    setEditingIndex(null);
                    setForm({ nome: '', tipo: 'Fortalecimento' });
                  }}
                />
              </View>
            )}
          </Card>
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.textMuted }}>
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
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>
                  {item.nome}
                  {item.tipo ? ` • ${item.tipo}` : ''}
                </Text>
                {!!item.descricao && <Text style={{ marginTop: 6 }}>{item.descricao}</Text>}
                <Text style={{ marginTop: 4, color: colors.textMuted }}>
                  {item.series ? `Séries: ${item.series}` : ''}
                  {item.repeticoes ? ` • Reps: ${item.repeticoes}` : ''}
                  {item.frequencia ? ` • ${item.frequencia}` : ''}
                </Text>
                {!!item.observacoes && (
                  <Text style={{ marginTop: 4, color: colors.textMuted }}>
                    Obs: {item.observacoes}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => handleEditStart(index)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: '#EFE8DB',
                  }}
                >
                  <Feather name="edit-3" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemove(index)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: '#FAE4E1',
                  }}
                >
                  <Feather name="trash-2" size={20} color="#A33" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
