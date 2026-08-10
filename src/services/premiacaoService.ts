import { CATEGORIAS_PREMIACAO, type CategoriaPremiacao, type Colaborador, type Premiacao, type Resultado } from "../types";
import { baixarCSV } from "../utils/exportar";

export type LancamentoPremiacao = { vendedorId: string } & Record<CategoriaPremiacao, number>;

export interface PremiacaoService {
  listarPremiacoes(filial: string, mesReferencia: string): Promise<Resultado<Premiacao[]>>;
  salvarPremiacoes(filial: string, mesReferencia: string, linhas: LancamentoPremiacao[]): Promise<Resultado<Premiacao[]>>;
}

/** Ver documento técnico, Seção 3.2 — Total = soma das 5 categorias, gravado */
export function somarCategoriasPremiacao(linha: Record<CategoriaPremiacao, number>): number {
  return CATEGORIAS_PREMIACAO.reduce((soma, categoria) => soma + linha[categoria], 0);
}

/**
 * Exportação CSV de Premiações (documento técnico, Seção 4): CPF, Nome,
 * Valor Total, Observações (sempre vazio). Usada tanto pela Planilha de
 * Premiação quanto pela Consulta por Período — mesmo botão/coluna no
 * protótipo.
 */
export function exportarPremiacoesCSV(premiacoes: Premiacao[], colaboradores: Colaborador[], filial: string): boolean {
  if (premiacoes.length === 0) return false;
  const linhas = premiacoes.map((p) => {
    const colaborador = colaboradores.find((c) => c.id === p.vendedorId);
    return [colaborador?.cpf ?? "", p.vendedorNome, p.total.toFixed(2), ""];
  });
  baixarCSV(["CPF", "Nome", "Valor Total", "Observações"], linhas, "premiacoes", filial);
  return true;
}
