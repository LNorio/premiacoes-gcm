export interface Comissao {
  id: string;
  vendedorId: string;
  vendedorNome: string;
  filial: string;
  mesReferencia: string;
  /** snapshot do PEV da Premiação no momento de salvar — nunca "ao vivo" depois */
  pev: number;
  valor: number;
  garantido: number;
  // não existe campo "total" nesta entidade
}
