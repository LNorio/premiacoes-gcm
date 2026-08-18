import type { AuthService } from "../../services/authService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Papel, type Resultado, type Sessao } from "../../types";
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
  "precisa trocar senha"?: boolean;
  token: string;
  mensagem: string;
}

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
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
        // Admin sempre entra vendo todas as filiais (documento técnico, Seção 1) — a API devolve
        // a filial vinculada ao próprio usuário admin, não "TODAS"; o seletor no cabeçalho permite
        // restringir a uma filial específica depois.
        filialAtiva: resposta.role === "admin" ? FILIAL_TODAS : resposta.filial,
        precisaTrocarSenha: resposta["precisa trocar senha"] || undefined,
      });
    } catch (erro) {
      if (erro instanceof ErroHttp) return resultadoErro(erro.message);
      return resultadoErro("Não foi possível conectar ao servidor. Tente novamente.");
    }
  },

  async logout() {
    definirToken(null);
  },

  async trocarSenhaPropria(senhaAtual, novaSenha): Promise<Resultado<void>> {
    try {
      // Autoatendimento de verdade (Claude/API (10).md) — qualquer colaborador logado troca a
      // própria senha informando a atual; zera "precisa trocar senha" automaticamente no sucesso.
      await httpClient.put("/api/trocar-senha", { "senha atual": senhaAtual, "senha nova": novaSenha });
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
