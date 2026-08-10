import type { Comissao, Resultado } from "../types";

export interface LancamentoComissao {
  vendedorId: string;
  valor: number;
  garantido: number;
}

export interface ComissaoService {
  listarComissoes(filial: string, mesReferencia: string): Promise<Resultado<Comissao[]>>;
  salvarComissao(filial: string, mesReferencia: string, linha: LancamentoComissao): Promise<Resultado<Comissao>>;
}
