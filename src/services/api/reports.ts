import { api } from "./http";
export type SummarizeResponse = { texto: string };

export async function generateReport({ pacienteId }: { pacienteId: string }) {
  const { data } = await api.post<SummarizeResponse>("/ai/summarize/by-paciente", {
    pacienteId,
    instrucoes: "Português do Brasil, clínico, 1 parágrafo."
  });
  return data;
}
