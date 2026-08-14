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

/**
 * Período de vigência do valor do plano, cadastrado pelo Admin por filial + tipo de plano +
 * tipo de pessoa — segue a lógica de fechamento de período da API real (`Claude/API (5).md`,
 * "Valores de Plano de Saúde"): só existe um período **vigente** (`ativo`) por filial + tipo de
 * plano + tipo de pessoa por vez; pra trocar o valor, primeiro encerra o vigente (`dataValidade`
 * passa a ser preenchida), só depois cadastra um novo. Um período encerrado é histórico e
 * imutável. **Titular e Dependente têm valor e vigência independentes** — cada um é um período
 * (registro) separado, não dois campos no mesmo período (ver `Claude/eventos-roadmap.md`,
 * 2026-08-14 — a API já teve as duas fases: só um `valor` para os dois, depois valor
 * independente por `tipoPessoa`).
 */
export interface PlanoSaudePeriodo {
  id: string;
  filial: string;
  tipoPlano: TipoPlanoSaude;
  tipoPessoa: "titular" | "dependente";
  valor: number;
  /** `true` = período vigente (usado nos meses a partir de `dataCriacao`); `false` = encerrado/histórico. */
  ativo: boolean;
  /** Data de início — quando o período foi cadastrado. Formato "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DD". */
  dataCriacao: string;
  /** Preenchida só ao encerrar o período (nunca antes). "YYYY-MM-DD", ou `null` enquanto vigente. */
  dataValidade: string | null;
}

/** Usados só para semear o período padrão inicial de cada filial (`src/adapters/mock/seed.ts`) — mantêm o valor que já estava em uso antes do Admin poder cadastrar períodos. */
export const FILIAIS_VALOR_DIFERENCIADO_SAUDE = ["401", "403"] as const;
export const VALOR_PADRAO_SAUDE_DIFERENCIADO = 255.54;
export const VALOR_PADRAO_SAUDE_PADRAO = 185.27;
export const VALOR_PADRAO_ODONTOLOGICO = 13.56;
