import { api } from './http';
import type { RegistroDto } from '../../types/dto';

const normalize = (r: any): RegistroDto => ({
  id: r.id,
  dataSessao: r.dataSessao,
  escalaDor: r.escalaDor ?? undefined,
  percepcaoEsforco: r.percepcaoEsforco ?? undefined,
  conseguiuRealizarTudo: r.conseguiuRealizarTudo ?? undefined,
  notasSubjetivas: r.notasSubjetivas ?? undefined,
  notasObjetivas: r.notasObjetivas ?? undefined,
  avaliacao: r.avaliacao ?? undefined,
  planoProximaSessao: r.planoProximaSessao ?? undefined,
  pacienteId: r.paciente?.id ?? r.pacienteId,
  planoId: r.plano?.id ?? r.planoId,
});

export async function listRegistrosByPaciente(pacienteId: string): Promise<RegistroDto[]> {
  const { data } = await api.get(`/registros/por-paciente/${pacienteId}`);
  const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return arr.map(normalize);
}

export async function createRegistro(payload: {
  pacienteId: string;
  planoId: string;
  dataSessao?: string;
  escalaDor?: number;
  percepcaoEsforco?: number;
  conseguiuRealizarTudo?: boolean;
  notasSubjetivas?: string;
  notasObjetivas?: string;
  avaliacao?: string;
  planoProximaSessao?: string;
}): Promise<RegistroDto> {
  const { data } = await api.post('/registros', payload);
  return normalize(data?.data ?? data);
}

export async function updateRegistro(
  id: string,
  dto: Partial<RegistroDto> & { planoId?: string }
): Promise<RegistroDto> {
  const { data } = await api.patch(`/registros/${id}`, dto);
  return normalize(data?.data ?? data);
}

export async function deleteRegistro(id: string): Promise<void> {
  await api.delete(`/registros/${id}`);
}
