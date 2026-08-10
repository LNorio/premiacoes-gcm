import type { DescontosService } from "../../services/descontosService";
import { FILIAL_TODAS, resultadoSucesso, type Colaborador, type DescontoBonificacao } from "../../types";
import { lerColecao, removerPorId, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "descontosBonificacoes";

function idsColaboradoresDaFilial(filial: string): Set<string> {
  const colaboradores = lerColecao<Colaborador>("colaboradores");
  const filtrados = filial === FILIAL_TODAS ? colaboradores : colaboradores.filter((c) => c.filial === filial);
  return new Set(filtrados.map((c) => c.id));
}

export const descontosServiceMock: DescontosService = {
  async listarDescontos(filial, mesReferencia) {
    garantirSeed();
    const idsFilial = idsColaboradoresDaFilial(filial);
    const lancamentos = lerColecao<DescontoBonificacao>(CHAVE).filter(
      (d) => d.mesReferencia === mesReferencia && idsFilial.has(d.vendedorId),
    );
    return resultadoSucesso(lancamentos);
  },

  async salvarDescontos(lancamentos) {
    garantirSeed();
    const salvos = lancamentos.map((lancamento) =>
      upsertPorId<DescontoBonificacao>(CHAVE, { ...lancamento, id: lancamento.id ?? "" }, "desc"),
    );
    return resultadoSucesso(salvos);
  },

  async removerDesconto(id) {
    garantirSeed();
    removerPorId(CHAVE, id);
    return resultadoSucesso(undefined);
  },
};
