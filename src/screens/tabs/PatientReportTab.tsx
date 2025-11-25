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
              /* --- CORREÇÃO AQUI: Configuração de Página --- */
              @page { margin: 20px; } 
              
              body { 
                font-family: 'Helvetica', sans-serif; 
                color: #333; 
                margin: 0; /* Remove margem padrão do body para usar a do @page */
                padding: 0;
              }

              .container {
                padding: 20px; /* Padding interno visual */
              }

              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${colors.primary}; padding-bottom: 15px; }
              .logo { font-size: 24px; font-weight: bold; color: ${colors.primary}; letter-spacing: 2px; }
              .sub-logo { font-size: 12px; text-transform: uppercase; color: #666; margin-top: 5px; }
              
              .patient-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #eee; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
              .label { font-weight: bold; color: #555; }
              
              .content { line-height: 1.6; font-size: 14px; text-align: justify; }
              h1, h2, h3 { color: ${colors.primaryDark}; margin-top: 25px; margin-bottom: 10px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 6px; }
              p { margin-bottom: 10px; }
              
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">REABTRACK AI</div>
                <div class="sub-logo">Relatório de Evolução Clínica</div>
              </div>

              <div class="patient-info">
                <div class="info-row">
                  <span class="label">PACIENTE:</span>
                  <span>${pacienteQ.data.nome}</span>
                </div>
                <div class="info-row">
                  <span class="label">DIAGNÓSTICO:</span>
                  <span>${pacienteQ.data.diagnostico}</span>
                </div>
                <div class="info-row">
                  <span class="label">DATA:</span>
                  <span>${new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div class="content">
                ${htmlContent}
              </div>

              <div class="footer">
                Gerado automaticamente via ReabTrack. Documento para acompanhamento de evolução.<br/>
                ID Paciente: ${id}
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ 
        html,
        // --- CORREÇÃO AQUI: Margens explícitas para o PDF ---
        margins: {
          left: 20,
          top: 30,
          right: 20,
          bottom: 30,
        }
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
              Gere um documento formal com a análise da evolução do paciente.
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