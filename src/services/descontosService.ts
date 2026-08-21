import { TIPOS_DESCONTO_BONIFICACAO, type DescontoBonificacao, type Resultado, type TipoDescontoBonificacao } from "../types";

export interface NovoLancamentoDesconto {
  vendedorId: string;
  mesReferencia: string;
  tipo: TipoDescontoBonificacao;
  valor: number;
  observacoes: string;
}

/** Roster mínimo de quem tem a tela "Descontos e Bonificações" — id/código/nome, o suficiente pra montar uma linha editável mesmo sem nenhum lançamento no mês. */
export interface ColaboradorComDescontos {
  id: string;
  codigo: string;
  nome: string;
}

export interface DescontosService {
  /**
   * `GET /api/descontos-bonificacoes` já traz o roster inteiro do mês (`Claude/API (18).md`
   * — ganhou `codigo`; `Claude/API (17).md` já trazia id/cpf/nome/filial) — devolve os
   * colaboradores habilitados junto com os lançamentos, sem precisar de uma chamada
   * separada a colaboradores só pra montar a lista de quem pode lançar.
   */
  listarDescontos(
    filial: string,
    mesReferencia: string,
  ): Promise<Resultado<{ colaboradores: ColaboradorComDescontos[]; lancamentos: DescontoBonificacao[] }>>;
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
