import { TIPOS_DESCONTO_BONIFICACAO, type DescontoBonificacao, type Resultado, type TipoDescontoBonificacao } from "../types";

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
  /** CSV gerado pelo backend (`GET /api/descontos-bonificacoes/exportar-csv`) — colunas fixas do próprio backend, não as exibidas em tela. */
  exportarCSV(filial: string, mesReferencia: string): Promise<Resultado<void>>;
}

export interface TotalPorTipo {
  tipo: TipoDescontoBonificacao;
  total: number;
}

/**
 * Um total por tipo de lançamento presente no mês (modal "Totais por tipo" de Descontos.tsx) —
 * só entram tipos com pelo menos um lançamento, com a soma simples dos valores (sempre
 * positivos, já que agora cada tipo aparece separado). Ordem fixa, seguindo
 * `TIPOS_DESCONTO_BONIFICACAO`.
 */
export function totaisPorTipo(linhas: { tipo: TipoDescontoBonificacao | ""; valor: number }[]): TotalPorTipo[] {
  const totais: TotalPorTipo[] = [];
  for (const tipo of TIPOS_DESCONTO_BONIFICACAO) {
    const linhasDoTipo = linhas.filter((l) => l.tipo === tipo);
    if (linhasDoTipo.length === 0) continue;
    totais.push({ tipo, total: linhasDoTipo.reduce((soma, l) => soma + l.valor, 0) });
  }
  return totais;
}
