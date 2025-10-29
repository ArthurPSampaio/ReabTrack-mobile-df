// src/services/api/agenda.ts
import { api } from './http';
import type { SessaoDto, StatusSessao } from '../../types/dto';

export async function listAgenda(params?: {
  from?: string;
  to?: string;
  pacienteId?: string;
  status?: StatusSessao;
}): Promise<SessaoDto[]> {
  const { data } = await api.get('/agenda', { params });
  // backend retorna array direto
  return Array.isArray(data) ? (data as SessaoDto[]) : [];
}

// helpers de data (local → ISO)
function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

/** Lista sessões entre hoje e hoje+7d */
export async function listAgendaRange(daysAhead = 7): Promise<SessaoDto[]> {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + daysAhead);

  return listAgenda({
    from: startOfDayISO(today),
    to: endOfDayISO(end),
  });
}

export async function createSessao(dto: {
  inicio: string;
  fim: string;
  pacienteId: string;
  planoId: string;
  local?: string;
  observacoes?: string;
}): Promise<SessaoDto> {
  const { data } = await api.post('/agenda', dto);
  return data;
}

export async function updateSessao(
  sessaoId: string,
  dto: Partial<Pick<SessaoDto, 'inicio' | 'fim' | 'local' | 'observacoes' | 'status'>> & {
    planoId?: string;
  }
): Promise<SessaoDto> {
  const { data } = await api.patch(`/agenda/${sessaoId}`, dto);
  return data;
}

export async function deleteSessao(sessaoId: string): Promise<void> {
  await api.delete(`/agenda/${sessaoId}`);
}
