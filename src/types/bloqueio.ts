export const TELAS_BLOQUEAVEIS = ["premiacao", "planoSaude", "descontos", "comissao", "estoque"] as const;
export type TelaBloqueavel = (typeof TELAS_BLOQUEAVEIS)[number];

/** Chave de bloqueio: "tela::filial::mesReferencia" (ex.: "premiacao::100::2026-07") */
export type ChaveBloqueio = string;
