export type Papel = "admin" | "gerente" | "coordenador" | "vendedor";

export type Tela =
  | "inicio"
  | "vendedores"
  | "consulta"
  | "consolidado-pev"
  | "premiacao"
  | "comissao"
  | "premiacao-estoque"
  | "descontos"
  | "plano-saude";

export const FILIAL_TODAS = "TODAS" as const;

export interface Sessao {
  role: Papel;
  nome: string;
  /** id do vendedor logado, apenas quando role === 'vendedor' */
  vendedorId?: string;
  /** filial ativa; FILIAL_TODAS só é possível para o Admin */
  filialAtiva: string | typeof FILIAL_TODAS;
  /** `true` quando o acesso acabou de ser criado ou a senha foi resetada pelo Admin — exige trocar a senha antes de usar o resto do sistema. */
  precisaTrocarSenha?: boolean;
}
