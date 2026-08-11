import { baixarExcel } from "../utils/exportar";
import type { Colaborador, Comissao, Resultado } from "../types";

export interface LancamentoComissao {
  vendedorId: string;
  valor: number;
  garantido: number;
}

export interface ComissaoService {
  listarComissoes(filial: string, mesReferencia: string): Promise<Resultado<Comissao[]>>;
  salvarComissao(filial: string, mesReferencia: string, linha: LancamentoComissao): Promise<Resultado<Comissao>>;
}

/** Documento técnico, Seção 4 — Código, Nome, PEV, Comissão, Garantido. */
export function exportarComissoesExcel(comissoes: Comissao[], colaboradores: Colaborador[], filial: string): boolean {
  if (comissoes.length === 0) return false;
  const linhas = comissoes.map((c) => {
    const colaborador = colaboradores.find((col) => col.id === c.vendedorId);
    return [colaborador?.codigo ?? "", c.vendedorNome, c.pev.toFixed(2), c.valor.toFixed(2), c.garantido.toFixed(2)];
  });
  void baixarExcel(["Código", "Nome", "PEV", "Comissão", "Garantido"], linhas, "comissoes", filial);
  return true;
}
