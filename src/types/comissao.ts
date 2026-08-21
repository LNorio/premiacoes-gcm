export interface Comissao {
  id: string;
  vendedorId: string;
  vendedorNome: string;
  /** `GET /api/comissoes` já traz o roster inteiro (`Claude/API (19).md`) — código/CPF/função vêm prontos, sem precisar cruzar com colaboradores. */
  codigo: string;
  cpf: string;
  cargo: string;
  filial: string;
  mesReferencia: string;
  /** snapshot do PEV da Premiação no momento de salvar — nunca "ao vivo" depois */
  pev: number;
  valor: number;
  garantido: number;
  // não existe campo "total" nesta entidade
}
