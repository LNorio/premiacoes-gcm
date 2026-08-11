import { obterPevDaPremiacao } from "../../services/consolidadoPevService";
import type { ComissaoService } from "../../services/comissaoService";
import { FILIAL_TODAS, resultadoSucesso, type Colaborador, type Comissao, type Premiacao } from "../../types";
import { lerColecao, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "comissoes";

function buscar(filial: string, mesReferencia: string): Comissao[] {
  return lerColecao<Comissao>(CHAVE).filter(
    (c) => (filial === FILIAL_TODAS || c.filial === filial) && c.mesReferencia === mesReferencia,
  );
}

export const comissaoServiceMock: ComissaoService = {
  async listarComissoes(filial, mesReferencia) {
    garantirSeed();
    return resultadoSucesso(buscar(filial, mesReferencia));
  },

  async salvarComissao(filial, mesReferencia, linha) {
    garantirSeed();
    const colaborador = lerColecao<Colaborador>("colaboradores").find((c) => c.id === linha.vendedorId);
    const existente = buscar(filial, mesReferencia).find((c) => c.vendedorId === linha.vendedorId);
    const filialDoRegistro = colaborador?.filial ?? existente?.filial ?? filial;
    const premiacoesDoMes = lerColecao<Premiacao>("premiacoes").filter(
      (p) => p.filial === filialDoRegistro && p.mesReferencia === mesReferencia,
    );

    const registro: Comissao = {
      id: existente?.id ?? "",
      vendedorId: linha.vendedorId,
      vendedorNome: colaborador?.nome ?? existente?.vendedorNome ?? "",
      filial: filialDoRegistro,
      mesReferencia,
      // snapshot do PEV no momento de salvar (documento técnico, Seção 3.5)
      pev: obterPevDaPremiacao(premiacoesDoMes, linha.vendedorId),
      valor: linha.valor,
      garantido: linha.garantido,
    };
    const salvo = upsertPorId(CHAVE, registro, "com");
    return resultadoSucesso(salvo);
  },
};
