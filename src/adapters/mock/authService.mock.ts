import type { AuthService } from "../../services/authService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type Resultado, type Sessao } from "../../types";
import { CREDENCIAIS_GESTAO } from "../../utils/constantes";
import { lerColecao } from "./db";
import { garantirSeed } from "./seed";

export const authServiceMock: AuthService = {
  async login(usuario, senha): Promise<Resultado<Sessao>> {
    garantirSeed();

    if (usuario === CREDENCIAIS_GESTAO.admin.usuario && senha === CREDENCIAIS_GESTAO.admin.senha) {
      return resultadoSucesso<Sessao>({ role: "admin", nome: "Administrador", filialAtiva: FILIAL_TODAS });
    }
    if (usuario === CREDENCIAIS_GESTAO.gerente.usuario && senha === CREDENCIAIS_GESTAO.gerente.senha) {
      return resultadoSucesso<Sessao>({ role: "gerente", nome: "Gerente", filialAtiva: CREDENCIAIS_GESTAO.gerente.filial });
    }
    if (usuario === CREDENCIAIS_GESTAO.coordenador.usuario && senha === CREDENCIAIS_GESTAO.coordenador.senha) {
      return resultadoSucesso<Sessao>({ role: "coordenador", nome: "Coordenador", filialAtiva: CREDENCIAIS_GESTAO.coordenador.filial });
    }

    const colaborador = lerColecao<Colaborador>("colaboradores").find(
      (v) => v.usuarioAcesso === usuario && v.senhaAcesso === senha,
    );
    if (colaborador) {
      return resultadoSucesso<Sessao>({
        role: "vendedor",
        nome: colaborador.nome,
        vendedorId: colaborador.id,
        filialAtiva: colaborador.filial,
      });
    }

    return resultadoErro("Usuário ou senha inválidos.");
  },

  async logout() {
    // Sem estado de sessão para limpar no adapter mock — a Sessão vive na UI (F2.AUTH-02).
  },
};
