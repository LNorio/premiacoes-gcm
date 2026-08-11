import { httpClient } from "./cliente";

/** Uma linha de colaborador dentro de um mês, em `GET /api/premiacoes` — ver Claude/API.md. */
export interface RespostaPremiacaoLinha {
  "nome colaborador": string;
  filial: string;
  pev: string;
  iconic: string;
  filtros: string;
  fornecedores: string;
  inadimplencia: string;
  total: number;
}

export interface RespostaMesPremiacoes {
  /** "YYYY-MM-01" */
  "mes de referencia": string;
  "mes formatado": string;
  "quantidade lancamentos": number;
  subtotal: number;
  dados: RespostaPremiacaoLinha[];
  totais: Record<string, number>;
}

export interface RespostaPremiacoesAgrupadas {
  periodo: string;
  total: number;
  meses: RespostaMesPremiacoes[];
}

/**
 * `GET /api/premiacoes` agrupa a resposta por mês (`"meses"`), mas não devolve
 * nenhum id de colaborador — só `"nome colaborador"` (e agora `"filial"`) por
 * linha. Para nunca depender de casar por nome (frágil: nomes duplicados ou
 * alterados casariam com a pessoa errada), busca-se sempre por `?id=`, um
 * colaborador de cada vez — ver Claude/eventos-roadmap.md.
 */
export function buscarPremiacoesAgrupadas(
  colaboradorId: string,
  filial: string,
  dataInicio?: string,
  dataFim?: string,
): Promise<RespostaPremiacoesAgrupadas> {
  const params = new URLSearchParams({ id: colaboradorId, filial });
  if (dataInicio) params.set("data_inicio", dataInicio);
  if (dataFim) params.set("data_fim", dataFim);
  return httpClient.get<RespostaPremiacoesAgrupadas>(`/api/premiacoes?${params.toString()}`);
}
