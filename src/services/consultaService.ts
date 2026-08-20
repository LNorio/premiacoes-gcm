import type { CategoriaPremiacao, Resultado } from "../types";

export interface FiltroConsulta {
  de: string;
  ate: string;
}

/** Um cartão por mês, com as 5 categorias + Total (documento técnico, Seção 3.4) */
export type CartaoMesConsulta = {
  mesReferencia: string;
  linhas: Array<
    { vendedorId: string; vendedorNome: string; cpf: string; filial: string; total: number } & Record<CategoriaPremiacao, number>
  >;
};

export interface ConsultaService {
  /** `escopo` restringe a um vendedorId quando o perfil é 'vendedor' */
  listarConsulta(filial: string, filtro: FiltroConsulta, escopo?: { vendedorId: string }): Promise<Resultado<CartaoMesConsulta[]>>;
  /**
   * Exportação CSV (documento técnico, Seção 4) — o CSV é gerado pelo próprio backend
   * (`GET /api/premiacoes/exportar-csv`, `Claude/API (15).md`), não mais montado no front.
   * Sempre usa o escopo inteiro da filial/vendedor (não só o período filtrado na tela) —
   * mesmo comportamento já existente antes desta troca.
   */
  exportarCSV(filial: string, filtro: FiltroConsulta, escopo?: { vendedorId: string }): Promise<Resultado<void>>;
}
