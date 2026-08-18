import type { Resultado, Sessao } from "../types";

export interface AuthService {
  login(usuario: string, senha: string): Promise<Resultado<Sessao>>;
  logout(): Promise<void>;
  /** Autoatendimento — colaborador troca a própria senha (ex.: após "precisa trocar senha"), informando a senha atual. */
  trocarSenhaPropria(senhaAtual: string, novaSenha: string): Promise<Resultado<void>>;
}
