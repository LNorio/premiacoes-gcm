import { formatarMesReferencia } from "../utils/formatadores";
import { baixarExcel } from "../utils/exportar";
import { TIPOS_DESCONTO_BONIFICACAO, type Colaborador, type DescontoBonificacao, type Resultado, type TipoDescontoBonificacao } from "../types";

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
