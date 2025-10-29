// src/services/api/patients.ts
import { api } from './http';
import type { PacienteDto } from '../../types/dto';

// lista pacientes (mantido)
export async function listPacientes(q?: string): Promise<PacienteDto[]> {
  const resp = await api.get('/pacientes', q ? { params: { q } } : undefined);
  const payload = resp.data;
  if (payload && Array.isArray(payload.data)) return payload.data as PacienteDto[];
  if (Array.isArray(payload)) return payload as PacienteDto[];
  return [];
}

// cria (mantido)
export async function createPaciente(dto: Omit<PacienteDto, 'id'>): Promise<PacienteDto> {
  const { data } = await api.post('/pacientes', dto);
  return data;
}

// obter por id (mantido)
export async function getPaciente(id: string): Promise<PacienteDto> {
  const { data } = await api.get(`/pacientes/${id}`);
  if (data?.data) return data.data as PacienteDto;
  return data as PacienteDto;
}

// atualizar paciente (PATCH)
export async function updatePaciente(
  id: string,
  dto: Partial<Omit<PacienteDto, 'id'>>
): Promise<PacienteDto> {
  const { data } = await api.patch(`/pacientes/${id}`, dto);
  return (data?.data ?? data) as PacienteDto;
}

// remover paciente
export async function deletePaciente(id: string): Promise<void> {
  await api.delete(`/pacientes/${id}`);
}
