import React, { useMemo, useState } from "react";
import { View, Text, Alert, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { PatientDetailTabParamList } from "../../navigation/types";
import type { RegistroDto } from "../../types/dto";

import { listRegistrosByPaciente } from "../../services/api/registros";
import { listPlanosByPaciente } from "../../services/api/plans";
// Quando a IA estiver pronta, implemente este serviço e descomente o uso real:
// import { generateReport } from '../../services/api/reports';

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { typography } from "../../theme/tokens";
import { colors } from "../../theme/colors";

type Props = BottomTabScreenProps<PatientDetailTabParamList, "Report">;

function mean(nums: number[]) {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 10) / 10;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export default function PatientReportTab({ route }: Props) {
  const { id } = route.params;

  // Carrega registros e planos (mapeia planoId → nome)
  const registrosQ = useQuery({
    queryKey: ["registros", id],
    queryFn: () => listRegistrosByPaciente(id),
  });

  const planosQ = useQuery({
    queryKey: ["planos", id],
    queryFn: () => listPlanosByPaciente(id),
  });

  const planoNomeById = useMemo(() => {
    const map: Record<string, string> = {};
    (planosQ.data || []).forEach((p) => (map[p.id] = p.objetivoGeral));
    return map;
  }, [planosQ.data]);

  // ==========================
  // Pré-resumo local (client-side)
  // ==========================
  const resumoLocal = useMemo(() => {
    const rs = (registrosQ.data || []) as RegistroDto[];
    if (!rs.length) return null;

    // ordena por data
    const sorted = [...rs].sort((a, b) => {
      const da = new Date(a.dataSessao || 0).getTime();
      const db = new Date(b.dataSessao || 0).getTime();
      return db - da;
    });

    const ult = sorted[0];
    const medias = {
      dor: mean(
        sorted
          .filter((r) => typeof r.escalaDor === "number")
          .map((r) => r.escalaDor!)
      ),
      esforco: mean(
        sorted
          .filter((r) => typeof r.percepcaoEsforco === "number")
          .map((r) => r.percepcaoEsforco!)
      ),
      adesao:
        sorted.filter((r) => r.conseguiuRealizarTudo === true).length > 0
          ? Math.round(
              (100 *
                sorted.filter((r) => r.conseguiuRealizarTudo === true).length) /
                sorted.length
            )
          : null,
    };

    const ult3Notas = sorted
      .map((r) => r.notasObjetivas || r.notasSubjetivas)
      .filter(Boolean)
      .slice(0, 3) as string[];

    const planosCount: Record<string, number> = {};
    sorted.forEach((r) => {
      planosCount[r.planoId] = (planosCount[r.planoId] || 0) + 1;
    });
    const planoMaisUsadoId = Object.keys(planosCount).sort(
      (a, b) => planosCount[b] - planosCount[a]
    )[0];
    const planoMaisUsadoNome =
      planoNomeById[planoMaisUsadoId] || planoMaisUsadoId;

    return {
      total: rs.length,
      ultimaData: ult?.dataSessao ? fmtDate(ult.dataSessao) : "—",
      medias,
      ult3Notas,
      planoMaisUsadoNome,
    };
  }, [registrosQ.data, planoNomeById]);

  // ==========================
  // Mutation para IA (placeholder)
  // ==========================
  const [reportText, setReportText] = useState<string | null>(null);

  const iaMut = useMutation({
    // Quando o endpoint existir, troque por:
    // mutationFn: () => generateReport({ pacienteId: id }),
    // Aqui criamos uma prévia usando os dados locais:
    mutationFn: async () => {
      const rs = (registrosQ.data || []) as RegistroDto[];
      if (!rs.length) {
        throw new Error("Não há registros suficientes para gerar o relatório.");
      }

      const r = resumoLocal!;
      const linhas: string[] = [];
      linhas.push(`Resumo clínico do paciente (pré-IA)`);
      linhas.push(`Total de registros: ${r.total}`);
      linhas.push(`Última sessão registrada em: ${r.ultimaData}`);
      if (r.medias.dor !== null)
        linhas.push(`Média de dor: ${r.medias.dor}/10`);
      if (r.medias.esforco !== null)
        linhas.push(`Média de esforço: ${r.medias.esforco}/10`);
      if (r.medias.adesao !== null)
        linhas.push(`Adesão relatada: ${r.medias.adesao}%`);
      if (r.planoMaisUsadoNome)
        linhas.push(`Plano mais utilizado: ${r.planoMaisUsadoNome}`);
      if (r.ult3Notas.length) {
        linhas.push(`Principais observações recentes:`);
        r.ult3Notas.forEach((n, i) =>
          linhas.push(`  • ${n}${i < r.ult3Notas.length - 1 ? "" : ""}`)
        );
      }
      linhas.push("");
      linhas.push(
        "⚠️ Este é um rascunho gerado localmente apenas para visualização. Quando a IA estiver conectada, este botão chamará a API para gerar um relatório textual customizado com base no histórico completo."
      );
      return linhas.join("\n");
    },
    onSuccess: (txt) => setReportText(txt),
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message || e?.message || "Falha ao gerar relatório";
      Alert.alert("Relatório", String(msg));
    },
  });

  // ==========================
  // UI
  // ==========================
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 4,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <Text style={[typography.h1]}>Relatório</Text>
        <Text style={{ ...typography.muted, marginTop: 2 }}>
          Geração de resumo a partir dos registros do paciente
        </Text>
      </View>

      {/* Bloco de status de dados */}
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="database" size={18} color={colors.text} />
          <Text style={[typography.h2]}>Dados disponíveis</Text>
        </View>
        <Text style={typography.muted}>
          Registros encontrados: {(registrosQ.data || []).length}
        </Text>
        {registrosQ.isLoading && <Text>Carregando registros...</Text>}
        {registrosQ.isError && (
          <Text style={{ color: colors.danger }}>
            Erro ao carregar registros. Puxe para atualizar na aba “Histórico”.
          </Text>
        )}
      </Card>

      {/* Resumo automático (client-side) */}
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="activity" size={18} color={colors.text} />
          <Text style={[typography.h2]}>Resumo automático (pré-IA)</Text>
        </View>

        {resumoLocal ? (
          <View style={{ gap: 6 }}>
            <Text>Total de registros: {resumoLocal.total}</Text>
            <Text>Última sessão: {resumoLocal.ultimaData}</Text>
            {resumoLocal.medias.dor !== null && (
              <Text>Média de dor: {resumoLocal.medias.dor}/10</Text>
            )}
            {resumoLocal.medias.esforco !== null && (
              <Text>Média de esforço: {resumoLocal.medias.esforco}/10</Text>
            )}
            {resumoLocal.medias.adesao !== null && (
              <Text>Adesão relatada: {resumoLocal.medias.adesao}%</Text>
            )}
            {!!resumoLocal.planoMaisUsadoNome && (
              <Text>
                Plano mais utilizado: {resumoLocal.planoMaisUsadoNome}
              </Text>
            )}

            {!!resumoLocal.ult3Notas.length && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontWeight: "700" }}>Observações recentes</Text>
                {resumoLocal.ult3Notas.map((n, i) => (
                  <Text key={i} style={{ color: colors.text }}>
                    • {n}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={typography.muted}>
            Ainda não há registros suficientes para montar um resumo.
          </Text>
        )}
      </Card>

      {/* Gerar relatório (IA) */}
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="cpu" size={18} color={colors.text} />
          <Text style={[typography.h2]}>Relatório com IA</Text>
        </View>

        <Text style={typography.muted}>
          Quando a API estiver pronta, este botão chamará o serviço para gerar
          um relatório textual contextualizado (RAG + modelo ajustado) a partir
          do histórico do paciente.
        </Text>

        <Button
          title={iaMut.isPending ? "Gerando..." : "Gerar Relatório (IA)"}
          onPress={() => iaMut.mutate()}
          disabled={iaMut.isPending || !(registrosQ.data || []).length}
          style={{ paddingVertical: 12 }}
        />

        {reportText && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: "700", marginBottom: 6 }}>Prévia</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#FBF7EF",
              }}
            >
              <Text style={{ lineHeight: 20 }}>{reportText}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Rodapé com instruções de integração */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "700" }}>Como integrar depois</Text>

        <Text style={typography.muted}>
          1) Crie{" "}
          <Text style={{ fontFamily: "monospace" }}>
            services/api/reports.ts
          </Text>{" "}
          com{" "}
          <Text style={{ fontFamily: "monospace" }}>
            generateReport(&#123; pacienteId &#125;)
          </Text>{" "}
          chamando sua API (FastAPI).
        </Text>

        <Text style={typography.muted}>
          2) Substitua a mutation por{" "}
          <Text style={{ fontFamily: "monospace" }}>
            mutationFn: () =&gt; generateReport(&#123; pacienteId: id &#125;)
          </Text>{" "}
          e renderize o texto retornado.
        </Text>

        <Text style={typography.muted}>
          3) (Opcional) Permita exportar em PDF e compartilhar.
        </Text>
      </View>
    </ScrollView>
  );
}
