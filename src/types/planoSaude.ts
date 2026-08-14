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
  /** id do vendedor titular da família — sempre preenchido, mesmo quando pessoaId é de um dependente */
  titularId: string;
  mesReferencia: string;
  tipoPlano: TipoPlanoSaude;
  /**
   * Só usados na sub-aba "saude" — o valor de Titular/Dependente nunca é
   * digitado nem persistido, é sempre fixo por filial/tipo (ver
   * VALOR_PADRAO_* abaixo) e recalculado a cada leitura.
   */
  valorAdicional?: number;
  valorCoparticipacao?: number;
}

export const FILIAIS_VALOR_DIFERENCIADO_SAUDE = ["401", "403"] as const;
export const VALOR_PADRAO_SAUDE_DIFERENCIADO = 255.54;
export const VALOR_PADRAO_SAUDE_PADRAO = 185.27;
export const VALOR_PADRAO_ODONTOLOGICO = 13.56;
