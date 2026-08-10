import { chaveBloqueio, type BloqueioService } from "../../services/bloqueioService";
import { resultadoSucesso } from "../../types";
import { gravarColecao, lerColecao } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "bloqueios";

export const bloqueioServiceMock: BloqueioService = {
  async consultarBloqueio(tela, filial, mesReferencia) {
    garantirSeed();
    const chave = chaveBloqueio(tela, filial, mesReferencia);
    return resultadoSucesso(lerColecao<string>(CHAVE).includes(chave));
  },

  async alternarBloqueio(tela, filial, mesReferencia) {
    garantirSeed();
    const chave = chaveBloqueio(tela, filial, mesReferencia);
    const bloqueios = lerColecao<string>(CHAVE);
    const jaBloqueado = bloqueios.includes(chave);
    gravarColecao(
      CHAVE,
      jaBloqueado ? bloqueios.filter((c) => c !== chave) : [...bloqueios, chave],
    );
    return resultadoSucesso(!jaBloqueado);
  },
};
