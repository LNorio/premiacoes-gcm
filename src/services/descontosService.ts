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
