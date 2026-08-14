import { formatarMesReferencia } from "../utils/formatadores";
import { baixarExcel } from "../utils/exportar";
import type { Colaborador, DescontoBonificacao, Resultado, TipoDescontoBonificacao } from "../types";

export interface NovoLancamentoDesconto {
  vendedorId: string;
  mesReferencia: string;
  tipo: TipoDescontoBonificacao;
  valor: number;
  observacoes: string;
}

export interface DescontosService {
  listarDescontos(filial: string, mesReferencia: string): Promise<Resultado<DescontoBonificacao[]>>;
  salvarDescontos(lancamentos: (NovoLancamentoDesconto & { id?: string })[]): Promise<Resultado<DescontoBonificacao[]>>;
  removerDesconto(id: string): Promise<Resultado<void>>;
}

/** Tipos que somam no Total exibido na tela — os demais (descontos de fato) subtraem. */
const TIPOS_QUE_SOMAM: readonly TipoDescontoBonificacao[] = ["Bonificação", "Ajuda de Custo/Gratificação"];

/**
 * Soma dos lançamentos para a coluna/rodapé "Total" de Descontos.tsx: Bonificação e
 * Ajuda de Custo/Gratificação somam, os demais tipos subtraem. Só afeta essa exibição —
 * o valor de cada lançamento continua sempre positivo, como digitado, tanto na célula
 * "Valor" quanto no que é salvo no adapter/API.
 */
export function somarDescontosComSinal(linhas: { tipo: TipoDescontoBonificacao | ""; valor: number }[]): number {
  return linhas.reduce((soma, l) => soma + (TIPOS_QUE_SOMAM.includes(l.tipo as TipoDescontoBonificacao) ? l.valor : -l.valor), 0);
}

/** Documento técnico, Seção 4 — CPF, Nome, Mês Referência, Tipo, Valor, Observações (1 linha por lançamento). */
export function exportarDescontosExcel(
  descontos: DescontoBonificacao[],
  colaboradores: Colaborador[],
  filial: string,
): boolean {
  if (descontos.length === 0) return false;
  const linhas = descontos.map((d) => {
    const colaborador = colaboradores.find((c) => c.id === d.vendedorId);
    return [
      colaborador?.cpf ?? "",
      colaborador?.nome ?? "",
      formatarMesReferencia(d.mesReferencia),
      d.tipo,
      d.valor.toFixed(2),
      d.observacoes || "",
    ];
  });
  void baixarExcel(["CPF", "Nome", "Mês Referência", "Tipo", "Valor", "Observações"], linhas, "descontos-bonificacoes", filial);
  return true;
}
