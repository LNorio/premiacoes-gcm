import type { Comissao, Resultado } from "../types";

export interface LancamentoComissao {
  vendedorId: string;
  valor: number;
  garantido: number;
}

export interface ComissaoService {
  listarComissoes(filial: string, mesReferencia: string): Promise<Resultado<Comissao[]>>;
  salvarComissao(filial: string, mesReferencia: string, linha: LancamentoComissao): Promise<Resultado<Comissao>>;
  /** CSV gerado pelo backend (`GET /api/comissoes/exportar-csv`) — colunas fixas do próprio backend, não as exibidas em tela. */
  exportarCSV(filial: string, mesReferencia: string): Promise<Resultado<void>>;
}
