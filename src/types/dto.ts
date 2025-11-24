export enum GeneroPaciente {
  MASCULINO = 'Masculino',
  FEMININO = 'Feminino',
}

export enum StatusPlano {
  ATIVO = 'Ativo',
  CONCLUIDO = 'Concluído',
  CANCELADO = 'Cancelado',
}

export enum TipoAtividade {
  FORTALECIMENTO = 'Fortalecimento',
  ALONGAMENTO = 'Alongamento',
  AEROBICO = 'Aeróbico',
  EQUILIBRIO = 'Equilíbrio',
  OUTRO = 'Outro',
}

export type StatusSessao = 'scheduled' | 'completed' | 'canceled' | 'no_show';

// --- DTOs ---

export type PacienteDto = {
  id: string;
  nome: string;
  dataNascimento: string; 
  genero: GeneroPaciente; 
  diagnostico: string;
  sintomas: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AtividadeDto = {
  id?: string;
  nome: string;
  descricao?: string;
  tipo?: TipoAtividade;
  series?: number;
  repeticoes?: number;
  frequencia?: string;
  observacoes?: string;
};

export type PlanoDto = {
  id: string;
  objetivoGeral: string;
  diagnosticoRelacionado: string;
  dataInicio: string; 
  dataFimPrevista?: string;
  status: StatusPlano;
  paciente: PacienteDto;
  atividades: AtividadeDto[];
};

export type RegistroDto = {
  id: string;
  dataSessao: string; 
  escalaDor?: number;
  percepcaoEsforco?: number;
  conseguiuRealizarTudo?: boolean;
  notasSubjetivas?: string;
  notasObjetivas?: string;
  avaliacao?: string;
  planoProximaSessao?: string;
  pacienteId: string;
  planoId: string;
};

export type SessaoDto = {
  id: string;
  inicio: string; 
  fim: string;
  status: StatusSessao;
  local?: string;
  observacoes?: string;
  paciente: PacienteDto;
  plano: PlanoDto; 
};