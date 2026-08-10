import type { Resultado, Sessao } from "../types";

export interface AuthService {
  login(usuario: string, senha: string): Promise<Resultado<Sessao>>;
  logout(): Promise<void>;
}
