import type { EstoqueColetivoMensal, EstoqueIndividualMensal, PoliticaEstoque, Resultado } from "../types";

/**
 * Condicional à decisão de negócio (F6, tela oculta hoje — ver documento
 * técnico, Seção 2.3). Interface preparada; a UI só é construída se/quando
 * a tela for reabilitada.
 */
export interface EstoqueService {
  obterPolitica(): Promise<Resultado<PoliticaEstoque>>;
  salvarPolitica(politica: PoliticaEstoque): Promise<Resultado<PoliticaEstoque>>;

  listarColetivo(filial: string, mesReferencia: string): Promise<Resultado<EstoqueColetivoMensal[]>>;
  salvarColetivo(registro: Omit<EstoqueColetivoMensal, "id"> & { id?: string }): Promise<Resultado<EstoqueColetivoMensal>>;

  listarIndividual(filial: string, mesReferencia: string): Promise<Resultado<EstoqueIndividualMensal[]>>;
  salvarIndividual(registro: Omit<EstoqueIndividualMensal, "id"> & { id?: string }): Promise<Resultado<EstoqueIndividualMensal>>;
}
