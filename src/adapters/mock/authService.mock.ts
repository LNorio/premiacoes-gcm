import type { AuthService } from "../../services/authService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type Resultado, type Sessao } from "../../types";
import { CREDENCIAIS_GESTAO } from "../../utils/constantes";
import { gravarColecao, gravarValor, lerColecao, lerValor } from "./db";
import { garantirSeed } from "./seed";

// A API real identifica "o colaborador autenticado" pelo token (Authorization: Bearer). O mock
// não modela sessão/token — guarda só o id de quem logou por último, pra `trocarSenhaPropria`
// (autoatendimento) saber em quem mexer, do mesmo jeito que o backend faria via token.
const CHAVE_SESSAO_ATUAL = "authMockColaboradorLogado";

export const authServiceMock: AuthService = {
  async login(usuario, senha): Promise<Resultado<Sessao>> {
    garantirSeed();

    if (usuario === CREDENCIAIS_GESTAO.admin.usuario && senha === CREDENCIAIS_GESTAO.admin.senha) {
      gravarValor<string | null>(CHAVE_SESSAO_ATUAL, null);
      return resultadoSucesso<Sessao>({ role: "admin", nome: "Administrador", filialAtiva: FILIAL_TODAS });
    }
    if (usuario === CREDENCIAIS_GESTAO.gerente.usuario && senha === CREDENCIAIS_GESTAO.gerente.senha) {
      gravarValor<string | null>(CHAVE_SESSAO_ATUAL, null);
      return resultadoSucesso<Sessao>({ role: "gerente", nome: "Gerente", filialAtiva: CREDENCIAIS_GESTAO.gerente.filial });
    }
    if (usuario === CREDENCIAIS_GESTAO.coordenador.usuario && senha === CREDENCIAIS_GESTAO.coordenador.senha) {
      gravarValor<string | null>(CHAVE_SESSAO_ATUAL, null);
      return resultadoSucesso<Sessao>({ role: "coordenador", nome: "Coordenador", filialAtiva: CREDENCIAIS_GESTAO.coordenador.filial });
    }

    const colaborador = lerColecao<Colaborador>("colaboradores").find(
      (v) => v.usuarioAcesso === usuario && v.senhaAcesso === senha,
    );
    if (colaborador) {
      gravarValor<string | null>(CHAVE_SESSAO_ATUAL, colaborador.id);
      return resultadoSucesso<Sessao>({
        role: "vendedor",
        nome: colaborador.nome,
        vendedorId: colaborador.id,
        filialAtiva: colaborador.filial,
        precisaTrocarSenha: colaborador.precisaTrocarSenha || undefined,
      });
    }

    return resultadoErro("Usuário ou senha inválidos.");
  },

  async logout() {
    gravarValor<string | null>(CHAVE_SESSAO_ATUAL, null);
  },

  async trocarSenhaPropria(senhaAtual, novaSenha): Promise<Resultado<void>> {
    garantirSeed();
    const idAtual = lerValor<string | null>(CHAVE_SESSAO_ATUAL, null);
    if (!idAtual) return resultadoErro("Sessão inválida — saia e entre novamente.");
    const colaboradores = lerColecao<Colaborador>("colaboradores");
    const colaborador = colaboradores.find((c) => c.id === idAtual);
    if (!colaborador) return resultadoErro("Colaborador não encontrado.");
    if (colaborador.senhaAcesso !== senhaAtual) return resultadoErro("Senha atual incorreta.");
    gravarColecao(
      "colaboradores",
      colaboradores.map((c) => (c.id === idAtual ? { ...c, senhaAcesso: novaSenha, precisaTrocarSenha: false } : c)),
    );
    return resultadoSucesso(undefined);
  },
};
