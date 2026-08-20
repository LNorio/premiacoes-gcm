import { CATEGORIAS_PREMIACAO, type CategoriaPremiacao, type Premiacao, type Resultado } from "../types";

export type LancamentoPremiacao = { vendedorId: string } & Record<CategoriaPremiacao, number>;

export interface PremiacaoService {
  listarPremiacoes(filial: string, mesReferencia: string): Promise<Resultado<Premiacao[]>>;
  salvarPremiacoes(filial: string, mesReferencia: string, linhas: LancamentoPremiacao[]): Promise<Resultado<Premiacao[]>>;
  /**
   * Exportação CSV de Premiações (documento técnico, Seção 4) — o CSV é gerado pelo
   * próprio backend (`GET /api/premiacoes/exportar-csv`, `Claude/API (15).md`), não mais
   * montado no front. Usa o mês inteiro de `mesReferencia` como período.
   */
  exportarPremiacoesCSV(filial: string, mesReferencia: string): Promise<Resultado<void>>;
}

/** Ver documento técnico, Seção 3.2 — Total = soma das 5 categorias, gravado */
export function somarCategoriasPremiacao(linha: Record<CategoriaPremiacao, number>): number {
  return CATEGORIAS_PREMIACAO.reduce((soma, categoria) => soma + linha[categoria], 0);
}
