import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PatientDetailTabParamList } from '../../navigation/types';
import { listRegistrosByPaciente } from '../../services/api/registros';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

type Props = BottomTabScreenProps<PatientDetailTabParamList, 'Report'>;

export default function PatientReportTab({ route }: Props) {
  const { id } = route.params;

  const registrosQ = useQuery({
    queryKey: ['registros', id],
    queryFn: () => listRegistrosByPaciente(id),
  });

  const resumoLocal = useMemo(() => {
    const items = registrosQ.data || [];
    if (!items.length) return 'Nenhum registro disponível.';

    const ordenados = [...items].sort((a, b) => {
      const da = a.dataSessao ? new Date(a.dataSessao).getTime() : 0;
      const db = b.dataSessao ? new Date(b.dataSessao).getTime() : 0;
      return db - da;
    });

    const recentes = ordenados.slice(0, 5);
    const mediaDorNum = recentes.filter(r => typeof r.escalaDor === 'number');
    const mediaEsforcoNum = recentes.filter(r => typeof r.percepcaoEsforco === 'number');

    const medias = {
      dor:
        mediaDorNum.reduce((acc, r) => acc + (r.escalaDor as number), 0) /
        Math.max(1, mediaDorNum.length || 1),
      esforco:
        mediaEsforcoNum.reduce((acc, r) => acc + (r.percepcaoEsforco as number), 0) /
        Math.max(1, mediaEsforcoNum.length || 1),
    };

    const concluidas = items.filter(r => r.conseguiuRealizarTudo === true).length;
    const total = items.length;

    return [
      `Últimos ${recentes.length} registros considerados.`,
      `Média de dor: ${isFinite(medias.dor) ? medias.dor.toFixed(1) : '—'} / 10.`,
      `Média de esforço: ${isFinite(medias.esforco) ? medias.esforco.toFixed(1) : '—'} / 10.`,
      `Realizou todas as atividades em ${concluidas} de ${total} registros.`,
    ].join('\n');
  }, [registrosQ.data]);

  const [reportText, setReportText] = useState<string | null>(null);

  const iaMut = useMutation({
    mutationFn: async () => {
      await new Promise(r => setTimeout(r, 800));
      const base = resumoLocal.replace(/\n/g, ' ');
      return `Relatório gerado:\n${base}`;
    },
    onSuccess: (txt: string) => setReportText(txt),
    onError: (e: any) => {
      const msg = e?.message || 'Falha ao gerar relatório';
      Alert.alert('Erro', msg);
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <Text style={[typography.h1]}>Relatório</Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <Card style={{ gap: 8 }}>
          <Text style={[typography.h2]}>Resumo</Text>
          <Text>{resumoLocal}</Text>
        </Card>

        <Card style={{ gap: 12 }}>
          <Button
            title={iaMut.isPending ? 'Gerando...' : 'Gerar relatório com IA'}
            onPress={() => iaMut.mutate()}
            disabled={iaMut.isPending || (registrosQ.data || []).length === 0}
          />

          {!!reportText && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Resultado</Text>
              <ScrollView style={{ maxHeight: 240 }}>
                <Text style={{ lineHeight: 20 }}>{reportText}</Text>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button title="Copiar" variant="outline" onPress={() => {}} />
                <Button title="Compartilhar" variant="outline" onPress={() => {}} />
              </View>
            </View>
          )}
        </Card>

        <TouchableOpacity activeOpacity={0.9}>
          <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 6 }}>
            Paciente ID: {id}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
