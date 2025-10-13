export type PacienteDto = {
  id: string;              
  nome: string;
  idade: number;
  genero: string;
  diagnostico: string;
  sintomas: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
};

// status conforme o backend (com acento e maiúsculas)
export type StatusPlano = 'Ativo' | 'Concluído' | 'Cancelado';

export type PlanoDto = {
  id: string;
  objetivoGeral: string;
  diagnosticoRelacionado: string;
  status: StatusPlano;
  pacienteId: string;
  // campos que podem existir no backend (sem travar o front):
  nome?: string;
  dataInicio?: string;
  dataFimPrevista?: string;
  atividades?: AtividadeDto[];
};

// modelamos atividade desde já (vamos plugar depois)
export type TipoAtividade = 'Fortalecimento' | 'Alongamento' | 'Aeróbico' | 'Equilíbrio' | 'Outro';

export type AtividadeDto = {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: TipoAtividade;
  duracaoMinutos?: number;
  series?: number;
  repeticoes?: number;
  frequencia?: string;
  observacoes?: string;
};

export type StatusSessao = 'scheduled' | 'completed' | 'canceled' | 'no_show';

export type SessaoDto = {
  id: string;
  inicio: string;        // ISO string
  fim: string;           // ISO string
  status: StatusSessao;
  local?: string;
  observacoes?: string;
  pacienteId: string;    // derivado do eager no backend; expomos como string no front
  planoId: string;       // obrigatório no create
};

export type RegistroDto = {
  id: string;
  dataSessao: string;        // ISO
  escalaDor?: number;        // 0..10
  percepcaoEsforco?: number; // 0..10
  conseguiuRealizarTudo?: boolean;
  notasSubjetivas?: string;
  notasObjetivas?: string;
  avaliacao?: string;
  planoProximaSessao?: string;
  pacienteId: string;        // mapeado do eager
  planoId: string;           // requerido no backend
};