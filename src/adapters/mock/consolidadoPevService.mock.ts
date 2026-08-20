import {
  calcularBaseCalculoPev,
  calcularPremiacaoAdicionalReceber,
  type ConsolidadoPevService,
  type LinhaConsolidadoPev,
} from "../../services/consolidadoPevService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type AdiantamentoFerias, type Colaborador, type Premiacao } from "../../types";
import { baixarCSV } from "../../utils/exportar";
import { obterMesesCicloPEV } from "../../utils/periodo";
import { lerColecao, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

/** Mesma ordem de `obterMesesCicloPEV` — cabeçalho do CSV gerado pelo backend real (`GET /api/consolidado/exportar-csv`). */
const CABECALHO_CSV = [
  "cpf",
  "nome",
  "valor dezembro",
  "valor janeiro",
  "valor fevereiro",
  "valor marco",
  "valor abril",
  "valor maio",
  "valor junho",
  "valor julho",
  "valor agosto",
  "valor setembro",
  "valor outubro",
  "valor novembro",
  "total acumulado",
  "base de calculo",
  "valor adiantamento",
  "premiacao total a receber",
];

export const consolidadoPevServiceMock: ConsolidadoPevService = {
  async listarConsolidadoPev(filial, anoCiclo, meses) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores").filter(
      (c) => (filial === FILIAL_TODAS || c.filial === filial) && c.telas.premiacoes,
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
        filial: colaborador.filial,
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

  async exportarCSV(filial, anoCiclo) {
    const meses = obterMesesCicloPEV(anoCiclo);
    const resultado = await consolidadoPevServiceMock.listarConsolidadoPev(filial, anoCiclo, meses);
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    if (dados.length === 0) return resultadoErro("Não há dados do Consolidado PEV para exportar.");

    const linhas = dados.map((l) => [
      l.cpf,
      l.vendedorNome,
      ...meses.map((mes) => (l.porMes[mes] ?? 0).toFixed(2)),
      l.totalAcumulado.toFixed(2),
      l.baseCalculo.toFixed(2),
      l.adiantamento.toFixed(2),
      l.premiacaoAdicionalReceber.toFixed(2),
    ]);
    baixarCSV(CABECALHO_CSV, linhas, "consolidado-pev", filial);
    return resultadoSucesso(undefined);
  },
};
