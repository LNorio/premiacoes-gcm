import type { CategoriaPremiacao, Resultado } from "../types";

export interface FiltroConsulta {
  de: string;
  ate: string;
}

/** Um cartão por mês, com as 5 categorias + Total (documento técnico, Seção 3.4) */
export type CartaoMesConsulta = {
  mesReferencia: string;
  linhas: Array<{ vendedorId: string; vendedorNome: string; cpf: string; total: number } & Record<CategoriaPremiacao, number>>;
};

export interface ConsultaService {
  /** `escopo` restringe a um vendedorId quando o perfil é 'vendedor' */
  listarConsulta(filtro: FiltroConsulta, escopo?: { vendedorId: string }): Promise<Resultado<CartaoMesConsulta[]>>;
}
