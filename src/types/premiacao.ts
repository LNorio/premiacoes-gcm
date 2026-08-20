export const CATEGORIAS_PREMIACAO = ["pev", "iconic", "filtros", "campanhasFornecedores", "inadimplencia"] as const;
export type CategoriaPremiacao = (typeof CATEGORIAS_PREMIACAO)[number];

export interface Premiacao {
  id: string;
  vendedorId: string;
  vendedorNome: string;
  /** Código do colaborador na filial (`Claude/API (15).md`) — único por filial, não mais globalmente. */
  codigo: string;
  filial: string;
  mesReferencia: string;
  pev: number;
  iconic: number;
  filtros: number;
  campanhasFornecedores: number;
  inadimplencia: number;
  /** soma das 5 categorias, gravado */
  total: number;
  // "Planilha Deivson" não é persistido — ver calcularPlanilhaDeivson em src/utils/calculos.ts
}
