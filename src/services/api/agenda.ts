import { api } from './http';
import type { SessaoDto, StatusSessao } from '../../types/dto';

// Lista com filtros (from/to ISO, pacienteId, status)
export async function listAgenda(params: {
  from?: string;
  to?: string;
  pacienteId?: string;
  status?: StatusSessao;
}): Promise<SessaoDto[]> {
  const { data } = await api.get('/agenda', { params });
  // Nest devolve a entidade; normalizamos para o shape do front
  const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  return arr.map((s: any) => ({
    id: s.id,
    inicio: s.inicio,
    fim: s.fim,
    status: s.status,
    local: s.local,
    observacoes: s.observacoes,
    pacienteId: s.paciente?.id ?? s.pacienteId,
    planoId: s.plano?.id ?? s.planoId,
  }));
}

// Cria sessão: POST /agenda
export async function createSessao(payload: {
  inicio: string;         // ISO ex.: '2025-10-12T14:30:00.000Z'
  fim: string;            // ISO
  pacienteId: string;
  planoId: string;
  local?: string;
  observacoes?: string;
}): Promise<SessaoDto> {
  const { data } = await api.post('/agenda', payload);
  const s = data?.data ?? data;
  return {
    id: s.id,
    inicio: s.inicio,
    fim: s.fim,
    status: s.status,
    local: s.local,
    observacoes: s.observacoes,
    pacienteId: s.paciente?.id ?? s.pacienteId,
    planoId: s.plano?.id ?? s.planoId,
  };
}

// Atualiza sessão: PATCH /agenda/:id
export async function updateSessao(id: string, dto: Partial<{
  inicio: string;
  fim: string;
  planoId: string;
  local: string;
  observacoes: string;
  status: StatusSessao;
}>): Promise<SessaoDto> {
  const { data } = await api.patch(`/agenda/${id}`, dto);
  const s = data?.data ?? data;
  return {
    id: s.id,
    inicio: s.inicio,
    fim: s.fim,
    status: s.status,
    local: s.local,
    observacoes: s.observacoes,
    pacienteId: s.paciente?.id ?? s.pacienteId,
    planoId: s.plano?.id ?? s.planoId,
  };
}

// Remove: DELETE /agenda/:id
export async function deleteSessao(id: string): Promise<void> {
  await api.delete(`/agenda/${id}`);
}
