import type { ColaboradoresService } from "../../services/colaboradoresService";
import { FILIAL_TODAS, resultadoSucesso, type Colaborador } from "../../types";
import { lerColecao, removerPorId, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "colaboradores";

export const colaboradoresServiceMock: ColaboradoresService = {
  async listarColaboradores(filial) {
    garantirSeed();
    const todos = lerColecao<Colaborador>(CHAVE);
    const filtrados = filial === FILIAL_TODAS ? todos : todos.filter((c) => c.filial === filial);
    return resultadoSucesso(filtrados);
  },

  async salvarColaborador(colaborador) {
    garantirSeed();
    const salvo = upsertPorId(CHAVE, colaborador, "col");
    return resultadoSucesso(salvo);
  },

  async removerColaborador(id) {
    garantirSeed();
    removerPorId(CHAVE, id);
    return resultadoSucesso(undefined);
  },
};
