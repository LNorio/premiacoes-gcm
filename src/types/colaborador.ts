import type { Papel } from "./auth";

export interface TelasHabilitadas {
  premiacoes: boolean;
  comissao: boolean;
  planoSaude: boolean;
  estoque: boolean;
  descontos: boolean;
}

export interface Colaborador {
  id: string;
  codigo: string;
  nome: string;
  cpf: string;
  filial: string;
  cargo: string;
  /** Perfil de acesso do colaborador (Cadastro de Colaboradores) — ver Claude/eventos-roadmap.md. */
  role: Papel;
  email: string;
  usuarioAcesso: string;
  senhaAcesso: string;
  telas: TelasHabilitadas;
  /** undefined é tratado como true (adesão por padrão) */
  adesaoSaude?: boolean;
  adesaoOdontologico?: boolean;
  /** `true` = inativo (desligado da empresa) — bloqueia login na API real. `undefined`/`false` = ativo. */
  desligado?: boolean;
  /** `true` quando o colaborador precisa trocar a senha no próximo acesso (mock-only — no HTTP real isso vem do login, não do cadastro). */
  precisaTrocarSenha?: boolean;
}
