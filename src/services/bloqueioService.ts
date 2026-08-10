import type { Papel, Resultado, TelaBloqueavel } from "../types";
import { PAPEL_EDITOR_POR_TELA } from "../utils/constantes";

/** Documento técnico, Seção 2.2 — string "tela::filial::mesReferencia" */
export function chaveBloqueio(tela: TelaBloqueavel, filial: string, mesReferencia: string): string {
  return `${tela}::${filial}::${mesReferencia}`;
}

/** Admin nunca é bloqueado (Seção 2.2 e 3.9) */
export function usuarioEstaBloqueadoNaTela(tela: TelaBloqueavel, role: Papel, bloqueado: boolean): boolean {
  if (role === "admin") return false;
  return bloqueado && role === PAPEL_EDITOR_POR_TELA[tela];
}

export interface BloqueioService {
  consultarBloqueio(tela: TelaBloqueavel, filial: string, mesReferencia: string): Promise<Resultado<boolean>>;
  /** Só o Admin pode chamar; a UI decide isso a partir da Sessão */
  alternarBloqueio(tela: TelaBloqueavel, filial: string, mesReferencia: string): Promise<Resultado<boolean>>;
}
