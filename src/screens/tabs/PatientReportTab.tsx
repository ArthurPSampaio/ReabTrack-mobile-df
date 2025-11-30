import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { marked } from 'marked';

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PatientDetailTabParamList } from '../../navigation/types';
import { listRegistrosByPaciente } from '../../services/api/registros';
import { getPaciente } from '../../services/api/patients';
import { generateReport } from '../../services/api/reports';
import type { SummarizeResponse } from '../../services/api/reports';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { radius, spacing, typography } from '../../theme/tokens';
import { colors } from '../../theme/colors';

type Props = BottomTabScreenProps<PatientDetailTabParamList, 'Report'>;

const screenWidth = Dimensions.get('window').width;

export default function PatientReportTab({ route }: Props) {
  const { id } = route.params;

  const pacienteQ = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => getPaciente(id),
  });

  const registrosQ = useQuery({
    queryKey: ['registros', id],
    queryFn: () => listRegistrosByPaciente(id),
  });

  const chartData = useMemo(() => {
    const items = registrosQ.data || [];
    if (items.length < 2) return null;

    const ordenados = [...items].sort((a, b) => {
      const da = a.dataSessao ? new Date(a.dataSessao).getTime() : 0;
      const db = b.dataSessao ? new Date(b.dataSessao).getTime() : 0;
      return da - db;
    });

    const slice = ordenados.slice(-6);

    return {
      labels: slice.map(r => {
        const d = new Date(r.dataSessao);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: slice.map(r => r.escalaDor ?? 0),
          color: (opacity = 1) => `rgba(217, 67, 94, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: slice.map(r => r.percepcaoEsforco ?? 0),
          color: (opacity = 1) => `rgba(0, 107, 125, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Dor', 'Esforço'],
    };
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
      Alert.alert('Sucesso', 'Texto copiado para a área de transferência.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const onGeneratePDF = async () => {
    if (!reportText || !pacienteQ.data) return;

    try {
      const htmlContent = await marked(reportText);

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              /* A CORREÇÃO DEFINITIVA: Margem no @page */
              @page { 
                margin: 50px; /* Define a margem física do papel (todas as páginas) */
                size: A4;
              }
              
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                color: #2D3436; 
                margin: 0; /* O body não precisa de margem, o @page cuida disso */
                padding: 0; 
                background: #FFF; 
              }

              /* Cabeçalho Premium */
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid ${colors.primary}; padding-bottom: 20px; margin-bottom: 30px; }
              .brand-box { display: flex; flex-direction: column; }
              .brand-title { font-size: 26px; font-weight: 800; color: ${colors.primary}; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
              .brand-subtitle { font-size: 11px; font-weight: 600; color: ${colors.textMuted}; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
              .doc-type { font-size: 12px; font-weight: bold; color: #FFF; background-color: ${colors.primary}; padding: 6px 12px; border-radius: 4px; text-transform: uppercase; }

              /* Card de Informações */
              .patient-card { background-color: #F8F9FA; border-left: 5px solid ${colors.primary}; padding: 20px; border-radius: 4px; margin-bottom: 35px; display: flex; flex-wrap: wrap; gap: 20px; }
              .info-group { flex: 1; min-width: 150px; }
              .info-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 4px; }
              .info-value { font-size: 16px; font-weight: 600; color: #2D3436; }

              /* Conteúdo */
              .content { font-size: 14px; line-height: 1.6; color: #444; text-align: justify; }
              
              /* Títulos */
              h1, h2, h3 { color: ${colors.primaryDark}; margin-top: 30px; margin-bottom: 15px; font-weight: 700; page-break-after: avoid; }
              h3 { font-size: 16px; border-bottom: 1px solid #EEE; padding-bottom: 8px; display: flex; align-items: center; }
              h3::before { content: '■'; color: ${colors.primary}; font-size: 10px; margin-right: 10px; display: inline-block; transform: translateY(-2px); }

              /* Tabela */
              table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; border-radius: 6px; overflow: hidden; page-break-inside: avoid; border: 1px solid #EEE; }
              th { background-color: ${colors.primary}; color: #FFF; text-align: left; padding: 12px 15px; font-weight: 600; text-transform: uppercase; }
              td { padding: 12px 15px; border-bottom: 1px solid #EEE; background-color: #FFF; color: #333; }
              tr:nth-child(even) td { background-color: #FAFAFA; }

              /* Rodapé */
              .signature-area { margin-top: 60px; display: flex; justify-content: flex-end; page-break-inside: avoid; }
              .signature-line { width: 250px; border-top: 1px solid #333; text-align: center; padding-top: 10px; font-size: 12px; font-weight: bold; color: #333; }
              
              .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #AAA; border-top: 1px solid #EEE; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand-box">
                <h1 class="brand-title">ReabTrack</h1>
                <div class="brand-subtitle">Inteligência em Reabilitação</div>
              </div>
              <div class="doc-type">Laudo de Evolução</div>
            </div>

            <div class="patient-card">
              <div class="info-group">
                <div class="info-label">Paciente</div>
                <div class="info-value">${pacienteQ.data.nome}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Diagnóstico</div>
                <div class="info-value">${pacienteQ.data.diagnostico}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Data do Relatório</div>
                <div class="info-value">${new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            <div class="content">
              ${htmlContent}
            </div>

            <div class="signature-area">
              <div class="signature-line">
                Fisioterapeuta Responsável
              </div>
            </div>

            <div class="footer">
              Documento gerado eletronicamente pelo sistema ReabTrack AI. <br/>
              ID de Controle: ${id} • Data de Geração: ${new Date().toLocaleString('pt-BR')}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ 
        html,
      });
      
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error: any) {
      Alert.alert('Erro ao criar PDF', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing(2), borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.background }}>
        <Text style={[typography.h1]}>Seu Progresso</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(2), gap: spacing(2) }}>
        
        <Card>
            <Text style={[typography.h3, { marginBottom: spacing(2) }]}>Evolução Visual</Text>
            
            {chartData ? (
              <>
                <LineChart
                  data={chartData}
                  width={screenWidth - spacing(8)}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.background,
                    backgroundGradientFrom: colors.background,
                    backgroundGradientTo: colors.background,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => colors.textMuted,
                    style: { borderRadius: 16 },
                    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  fromZero
                  yAxisInterval={1}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                   <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                      <View style={{ width:10, height:10, borderRadius:5, backgroundColor: '#D9435E' }}/>
                      <Text style={typography.small}>Dor</Text>
                   </View>
                   <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                      <View style={{ width:10, height:10, borderRadius:5, backgroundColor: '#006B7D' }}/>
                      <Text style={typography.small}>Esforço</Text>
                   </View>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', padding: 20, gap: 10 }}>
                 <MaterialCommunityIcons name="chart-line-variant" size={40} color={colors.line} />
                 <Text style={{ ...typography.body, textAlign: 'center', color: colors.textMuted }}>
                    Ainda não temos dados suficientes para gerar seu gráfico.
                 </Text>
                 <Text style={typography.small}>
                    Complete mais uma sessão para visualizar sua linha de progresso!
                 </Text>
              </View>
            )}
        </Card>

        <Card style={{ gap: spacing(1.5) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
             <Text style={[typography.h2]}>Relatório Oficial</Text>
             {!!reportText && <Text style={{ fontSize: 10, color: colors.success, fontWeight: 'bold' }}>PRONTO</Text>}
          </View>
          
          {!reportText && (
            <Text style={typography.body}>
              Gere um documento formal com a análise da evolução do paciente para arquivamento ou envio.
            </Text>
          )}

          {!reportText && (
             <Button
                title={iaMut.isPending ? 'Gerando Relatório...' : 'Gerar Relatório Clínico'}
                onPress={() => iaMut.mutate()}
                disabled={iaMut.isPending || (registrosQ.data || []).length === 0}
             />
          )}

          {!!reportText && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing(1.5), gap: spacing(1.5), marginTop: spacing(1) }}>
              <View style={{ 
                borderWidth: 1, 
                borderColor: colors.line,
                padding: spacing(1.25), 
                borderRadius: radius.md,
                backgroundColor: '#FDFDFD',
              }}>
                <Markdown style={{ 
                  body: { ...typography.body, fontSize: 15, lineHeight: 24, color: '#333' },
                  heading1: { ...typography.h2, marginTop: 10, marginBottom: 10, color: colors.primaryDark },
                  heading2: { ...typography.h3, marginTop: 15, marginBottom: 5, color: colors.primary },
                  strong: { fontWeight: '700', color: '#000' },
                }}>
                  {reportText}
                </Markdown>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing(1.25) }}>
                <Button title="Copiar" variant="outline" onPress={onCopy} style={{ flex: 1 }} />
                <Button 
                  title="Baixar PDF" 
                  variant="primary" 
                  onPress={onGeneratePDF} 
                  style={{ flex: 1 }} 
                />
              </View>
              
              <Button 
                title="Gerar Novamente" 
                variant="text" 
                onPress={() => iaMut.mutate()} 
                style={{ marginTop: -5 }}
              />
            </View>
          )}
        </Card>

        <TouchableOpacity activeOpacity={0.9}>
          <Text style={[typography.small, { textAlign: 'center', marginTop: spacing(1), marginBottom: spacing(3) }]}>
            ReabTrack AI • Paciente: {id.slice(0, 8)}...
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}