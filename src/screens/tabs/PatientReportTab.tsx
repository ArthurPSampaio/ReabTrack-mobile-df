import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Share } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PatientDetailTabParamList } from '../../navigation/types';
import { listRegistrosByPaciente } from '../../services/api/registros';
import { generateReport } from '../../services/api/reports';
import type { SummarizeResponse } from '../../services/api/reports';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { radius, spacing, typography } from '../../theme/tokens';
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
    mutationFn: () => generateReport({ pacienteId: id }),
    onSuccess: (data: SummarizeResponse) => {
      setReportText(data.texto);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao gerar relatório';
      Alert.alert('Erro', msg);
    },
  });

  const onCopy = async () => {
    if (!reportText) return;
    try {
      await Clipboard.setStringAsync(reportText);
      Alert.alert('Sucesso', 'Relatório copiado para a área de transferência.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const onShare = async () => {
    if (!reportText) return;
    try {
      await Share.share({
        message: reportText,
        title: `Relatório de Paciente`,
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing(2), borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.background }}>
        <Text style={[typography.h1]}>Relatório</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(2), gap: spacing(1.5) }}>
        <Card style={{ gap: spacing(1) }}>
          <Text style={[typography.h2]}>Resumo Local</Text>
          <Text style={typography.body}>{resumoLocal}</Text>
        </Card>

        <Card style={{ gap: spacing(1.5) }}>
          <Button
            title={iaMut.isPending ? 'Gerando...' : 'Gerar relatório com IA'}
            onPress={() => iaMut.mutate()}
            disabled={iaMut.isPending || (registrosQ.data || []).length === 0}
          />

          {!!reportText && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing(1.5), gap: spacing(1.5) }}>
              <Text style={typography.h2}>Resultado da IA</Text>
              
              <ScrollView style={{ 
                maxHeight: 240, 
                borderWidth: 1, 
                borderColor: colors.line,
                padding: spacing(1.25), 
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              }}>
                <Markdown style={{ 
                  body: { ...typography.body, lineHeight: 22 },
                  heading1: typography.h2,
                  heading2: typography.h3,
                  strong: { fontWeight: '700' },
                }}>
                  {reportText}
                </Markdown>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: spacing(1.25), marginTop: spacing(0.5) }}>
                <Button title="Copiar" variant="outline" onPress={onCopy} style={{ flex: 1 }} />
                <Button title="Compartilhar" variant="outline" onPress={onShare} style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </Card>

        <TouchableOpacity activeOpacity={0.9}>
          <Text style={[typography.small, { textAlign: 'center', marginTop: spacing(1) }]}>
            Paciente ID: {id}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}