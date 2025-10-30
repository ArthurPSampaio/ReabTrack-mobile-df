import { api } from './http';
import type { PlanoDto, AtividadeDto } from '../../types/dto';

export async function listPlanosByPaciente(pacienteId: string): Promise<PlanoDto[]> {
  const { data } = await api.get(`/planos/por-paciente/${pacienteId}`);
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export async function createPlano(payload: {
  pacienteId: string;
  objetivoGeral: string;
  diagnosticoRelacionado: string;
  status?: 'Ativo' | 'Concluído' | 'Cancelado';
  dataFimPrevista?: string;
  atividades?: {
    nome: string;
    descricao?: string;
    tipo?: string;
    series?: number;
    repeticoes?: number;
    frequencia?: string;
    observacoes?: string;
  }[];
}) {
  const { data } = await api.post('/planos', payload);
  return data?.data ?? data;
}

export async function getPlanoById(id: string): Promise<PlanoDto> {
  const { data } = await api.get(`/planos/${id}`);
  return data?.data ?? data;
}

export async function updatePlano(
  planoId: string,
  payload: Partial<
    Pick<PlanoDto, 'objetivoGeral' | 'diagnosticoRelacionado' | 'status' | 'dataFimPrevista' | 'atividades'>
  >
): Promise<PlanoDto> {
  const { data } = await api.patch(`/planos/${planoId}`, payload);
  return data?.data ?? data;
}

export async function saveAtividades(planoId: string, atividades: AtividadeDto[]): Promise<PlanoDto> {
  return updatePlano(planoId, { atividades });
}

export async function appendAtividade(plano: PlanoDto, nova: AtividadeDto): Promise<PlanoDto> {
  const atuais = Array.isArray(plano.atividades) ? plano.atividades : [];
  return updatePlano(plano.id, { atividades: [...atuais, nova] });
}
