import type { DescontoBonificacao, Resultado, TipoDescontoBonificacao } from "../types";

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
