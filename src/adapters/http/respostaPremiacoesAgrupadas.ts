import { FILIAL_TODAS } from "../../types";
import { decodificarCsvBase64 } from "../../utils/exportar";
import { httpClient } from "./cliente";

/** Uma linha de colaborador dentro de um mês, em `GET /api/premiacoes` — ver Claude/API (15).md. */
export interface RespostaPremiacaoLinha {
  "id colaborador": number;
  codigo: string;
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
 * `GET /api/premiacoes` agrupa a resposta por mês (`"meses"`). Desde `Claude/API (15).md`
 * cada linha já traz `"id colaborador"`/`"codigo"`, então não precisa mais buscar um
 * colaborador de cada vez pra casar o resultado com segurança (antes só vinha
 * `"nome colaborador"`, e casar por nome era frágil — ver `Claude/eventos-roadmap.md`,
 * entradas de 2026-08-10/11 e 2026-08-20). `colaboradorId` continua opcional: omitido,
 * a API devolve todos os colaboradores da filial de uma vez (usado por Premiação/Consulta
 * pra montar tudo numa única chamada); informado, filtra só aquele colaborador (usado
 * quando o escopo precisa ficar restrito a um vendedor específico, por privacidade).
 */
export function buscarPremiacoesAgrupadas(
  colaboradorId: string | undefined,
  filial: string,
  dataInicio?: string,
  dataFim?: string,
): Promise<RespostaPremiacoesAgrupadas> {
  const params = new URLSearchParams();
  // "TODAS" é um sentinela só do front — a API entende "de todas as filiais" pela
  // ausência do parâmetro (mesma convenção já usada em colaboradoresService.http.ts).
  if (filial !== FILIAL_TODAS) params.set("filial", filial);
  if (colaboradorId) params.set("id", colaboradorId);
  if (dataInicio) params.set("data_inicio", dataInicio);
  if (dataFim) params.set("data_fim", dataFim);
  return httpClient.get<RespostaPremiacoesAgrupadas>(`/api/premiacoes?${params.toString()}`);
}

/** Resposta de `GET /api/premiacoes/exportar-csv` — mesmo CSV que o backend gera pra tela. */
interface RespostaCsvPremiacoes {
  "arquivo csv": string;
  mensagem: string;
}

/**
 * Baixa o CSV de premiações já pronto do backend (`Claude/API (15).md`) — mesmos
 * parâmetros de `GET /api/premiacoes`, inclusive `id` pra restringir a um único
 * colaborador (usado no escopo de vendedor). Decodifica o base64 e devolve o
 * conteúdo do CSV como texto puro.
 */
export async function buscarCsvPremiacoes(params: {
  filial: string;
  colaboradorId?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<string> {
  const query = new URLSearchParams();
  if (params.filial !== FILIAL_TODAS) query.set("filial", params.filial);
  if (params.colaboradorId) query.set("id", params.colaboradorId);
  if (params.dataInicio) query.set("data_inicio", params.dataInicio);
  if (params.dataFim) query.set("data_fim", params.dataFim);
  const resposta = await httpClient.get<RespostaCsvPremiacoes>(`/api/premiacoes/exportar-csv?${query.toString()}`);
  return decodificarCsvBase64(resposta["arquivo csv"]);
}
