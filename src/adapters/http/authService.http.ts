import type { AuthService } from "../../services/authService";
import { resultadoErro, resultadoSucesso, type Papel, type Resultado, type Sessao } from "../../types";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";
import { definirToken } from "./token";

/** Resposta de `POST /api/valida-usuario` — ver Claude/API.md. */
interface RespostaValidaUsuario {
  "id colaborador": number;
  codigo: string;
  funcao: string;
  nome: string;
  role: Papel;
  filial: string;
  "quantidade de premiacoes": number;
  "valor premiacoes": number;
  token: string;
  mensagem: string;
}

export const authServiceHttp: AuthService = {
  async login(usuario, senha): Promise<Resultado<Sessao>> {
    try {
      const resposta = await httpClient.post<RespostaValidaUsuario>("/api/valida-usuario", { usuario, senha });
      definirToken(resposta.token);
      return resultadoSucesso<Sessao>({
        role: resposta.role,
        nome: resposta.nome,
        vendedorId: String(resposta["id colaborador"]),
        filialAtiva: resposta.filial,
      });
    } catch (erro) {
      if (erro instanceof ErroHttp) return resultadoErro(erro.message);
      return resultadoErro("Não foi possível conectar ao servidor. Tente novamente.");
    }
  },

  async logout() {
    definirToken(null);
  },
};
