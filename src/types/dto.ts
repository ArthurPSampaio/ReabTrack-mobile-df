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
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type StatusPlano = 'Ativo' | 'Concluído' | 'Cancelado';

export type PlanoDto = {
  id: string;
  objetivoGeral: string;
  diagnosticoRelacionado: string;
  status: StatusPlano;
  pacienteId: string;
  nome?: string;
  dataInicio?: string;
  dataFimPrevista?: string;
  atividades?: AtividadeDto[];
};

export type TipoAtividade =
  | 'Fortalecimento'
  | 'Alongamento'
  | 'Aeróbico'
  | 'Equilíbrio'
  | 'Outro';

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
  inicio: string;
  fim: string;
  status: StatusSessao;
  local?: string;
  observacoes?: string;
  pacienteId: string;
  planoId: string;
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
