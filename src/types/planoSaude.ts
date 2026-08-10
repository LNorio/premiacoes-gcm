export type TipoPlanoSaude = "saude" | "odontologico";

export interface PlanoSaudeDependente {
  id: string;
  vendedorId: string;
  nome: string;
  cpf: string;
}

export interface PlanoSaudeLancamento {
  id: string;
  /** id do vendedor (titular) OU do dependente */
  pessoaId: string;
  mesReferencia: string;
  tipoPlano: TipoPlanoSaude;
  /** só um dos dois é != null por pessoa (titular OU dependente) */
  valorTitular: number | null;
  valorDependente: number | null;
  /** só usados na sub-aba "saude", se configurados */
  valorAdicional?: number;
  valorCoparticipacao?: number;
}

export const FILIAIS_VALOR_DIFERENCIADO_SAUDE = ["401", "403"] as const;
export const VALOR_PADRAO_SAUDE_DIFERENCIADO = 255.54;
export const VALOR_PADRAO_SAUDE_PADRAO = 185.27;
export const VALOR_PADRAO_ODONTOLOGICO = 13.56;
