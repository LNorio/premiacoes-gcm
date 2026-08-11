import type { ColaboradoresService } from "../../services/colaboradoresService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type Papel, type Resultado, type TelasHabilitadas } from "../../types";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

/**
 * IDs numéricos de `telas` (tabela `colaborador_has_telas`) — não documentados
 * em `Claude/API.md` e sem endpoint para consulta. Assumida a mesma ordem já
 * usada internamente (`ROTULOS_TELAS_COLABORADOR`), a pedido do usuário —
 * pode estar errada; ver `Claude/eventos-roadmap.md`.
 */
const ID_TELA: Record<keyof TelasHabilitadas, number> = {
  premiacoes: 1,
  comissao: 2,
  planoSaude: 3,
  estoque: 4,
  descontos: 5,
};
const TELA_POR_ID = new Map<number, keyof TelasHabilitadas>(
  (Object.entries(ID_TELA) as [keyof TelasHabilitadas, number][]).map(([chave, id]) => [id, chave]),
);

function paraIdsTela(telas: TelasHabilitadas): number[] {
  return (Object.keys(ID_TELA) as (keyof TelasHabilitadas)[]).filter((chave) => telas[chave]).map((chave) => ID_TELA[chave]);
}

/** Resposta de `GET /api/usuarios` — ver Claude/API.md. */
interface RespostaUsuario {
  "id colaborador": number;
  codigo: string | null;
  nome: string;
  cpf: string;
  funcao: string;
  email: string;
  usuario: string;
  role: Papel;
  filial: string;
  "plano saude": boolean;
  "plano odontologico": boolean;
  telas: number[];
}

function paraColaborador(resposta: RespostaUsuario): Colaborador {
  const telas: TelasHabilitadas = { premiacoes: false, comissao: false, planoSaude: false, estoque: false, descontos: false };
  for (const id of resposta.telas) {
    const chave = TELA_POR_ID.get(id);
    if (chave) telas[chave] = true;
  }
  return {
    id: String(resposta["id colaborador"]),
    codigo: resposta.codigo ?? "",
    nome: resposta.nome,
    cpf: resposta.cpf,
    filial: resposta.filial,
    cargo: resposta.funcao,
    role: resposta.role,
    email: resposta.email,
    usuarioAcesso: resposta.usuario,
    // a API nunca devolve a senha (write-only) — ver ajuste em CadastroColaboradores.tsx.
    senhaAcesso: "",
    telas,
    adesaoSaude: resposta["plano saude"],
    adesaoOdontologico: resposta["plano odontologico"],
  };
}

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

export const colaboradoresServiceHttp: ColaboradoresService = {
  async listarColaboradores(filial): Promise<Resultado<Colaborador[]>> {
    try {
      const query = filial === FILIAL_TODAS ? "" : `?filial=${encodeURIComponent(filial)}`;
      const resposta = await httpClient.get<RespostaUsuario[]>(`/api/usuarios${query}`);
      return resultadoSucesso(resposta.map(paraColaborador));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarColaborador(colaborador): Promise<Resultado<Colaborador>> {
    const corpo = {
      codigo: colaborador.codigo || undefined,
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      funcao: colaborador.cargo,
      email: colaborador.email,
      usuario: colaborador.usuarioAcesso,
      // só envia a senha se o usuário digitou uma nova — em branco mantém a atual.
      ...(colaborador.senhaAcesso ? { senha: colaborador.senhaAcesso } : {}),
      role: colaborador.role,
      filial: colaborador.filial,
      "plano saude": colaborador.adesaoSaude ?? true,
      "plano odontologico": colaborador.adesaoOdontologico ?? true,
      // Mapeamento telas → IDs assumido (ID_TELA acima); pode estar errado.
      telas: paraIdsTela(colaborador.telas),
    };
    try {
      if (colaborador.id) {
        await httpClient.put(`/api/usuarios/${colaborador.id}`, corpo);
        return resultadoSucesso(colaborador);
      }

      await httpClient.post(`/api/usuarios`, corpo);
      // POST não devolve o registro criado (sem id) — relista para obter o id real.
      const todos = await httpClient.get<RespostaUsuario[]>(
        `/api/usuarios?filial=${encodeURIComponent(colaborador.filial)}`,
      );
      const criado = todos.find((u) => u.usuario === colaborador.usuarioAcesso);
      return resultadoSucesso(criado ? paraColaborador(criado) : colaborador);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async removerColaborador(id): Promise<Resultado<void>> {
    try {
      await httpClient.delete(`/api/usuarios/${id}`);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
