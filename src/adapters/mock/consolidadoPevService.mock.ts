import {
  calcularBaseCalculoPev,
  calcularPremiacaoAdicionalReceber,
  type ConsolidadoPevService,
  type LinhaConsolidadoPev,
} from "../../services/consolidadoPevService";
import { FILIAL_TODAS, resultadoSucesso, type AdiantamentoFerias, type Colaborador, type Premiacao } from "../../types";
import { lerColecao, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

export const consolidadoPevServiceMock: ConsolidadoPevService = {
  async listarConsolidadoPev(filial, anoCiclo, meses) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores").filter(
      (c) => filial === FILIAL_TODAS || c.filial === filial,
    );
    const premiacoes = lerColecao<Premiacao>("premiacoes");
    const adiantamentos = lerColecao<AdiantamentoFerias>("adiantamentosFerias");

    const linhas: LinhaConsolidadoPev[] = colaboradores.map((colaborador) => {
      const porMes: Record<string, number> = {};
      let totalAcumulado = 0;
      for (const mes of meses) {
        const pev = premiacoes.find((p) => p.vendedorId === colaborador.id && p.mesReferencia === mes)?.pev ?? 0;
        porMes[mes] = pev;
        totalAcumulado += pev;
      }
      const adiantamento =
        adiantamentos.find((a) => a.vendedorId === colaborador.id && a.anoCiclo === anoCiclo)?.valor ?? 0;
      const baseCalculo = calcularBaseCalculoPev(totalAcumulado);

      return {
        vendedorId: colaborador.id,
        vendedorNome: colaborador.nome,
        cpf: colaborador.cpf,
        porMes,
        totalAcumulado,
        baseCalculo,
        adiantamento,
        premiacaoAdicionalReceber: calcularPremiacaoAdicionalReceber(baseCalculo, adiantamento),
      };
    });

    return resultadoSucesso(linhas);
  },

  async salvarAdiantamento(vendedorId, anoCiclo, valor) {
    garantirSeed();
    const existente = lerColecao<AdiantamentoFerias>("adiantamentosFerias").find(
      (a) => a.vendedorId === vendedorId && a.anoCiclo === anoCiclo,
    );
    upsertPorId<AdiantamentoFerias>("adiantamentosFerias", { id: existente?.id ?? "", vendedorId, anoCiclo, valor }, "adto");
    return resultadoSucesso(undefined);
  },
};
