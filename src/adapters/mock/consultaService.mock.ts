import type { CartaoMesConsulta, ConsultaService } from "../../services/consultaService";
import { CATEGORIAS_PREMIACAO, FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type Premiacao } from "../../types";
import { baixarCSV } from "../../utils/exportar";
import { lerColecao } from "./db";
import { garantirSeed } from "./seed";

function buscarPremiacoes(filial: string, escopo?: { vendedorId: string }): Premiacao[] {
  return lerColecao<Premiacao>("premiacoes").filter(
    (p) => (filial === FILIAL_TODAS || p.filial === filial) && (!escopo || p.vendedorId === escopo.vendedorId),
  );
}

export const consultaServiceMock: ConsultaService = {
  async listarConsulta(filial, filtro, escopo) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores");
    const premiacoes = lerColecao<Premiacao>("premiacoes").filter(
      (p) =>
        (filial === FILIAL_TODAS || p.filial === filial) &&
        (!filtro.de || p.mesReferencia >= filtro.de) &&
        (!filtro.ate || p.mesReferencia <= filtro.ate) &&
        (!escopo || p.vendedorId === escopo.vendedorId),
    );

    const meses = [...new Set(premiacoes.map((p) => p.mesReferencia))].sort();
    const cartoes: CartaoMesConsulta[] = meses.map((mesReferencia) => ({
      mesReferencia,
      linhas: premiacoes
        .filter((p) => p.mesReferencia === mesReferencia)
        .map((p) => ({
          vendedorId: p.vendedorId,
          vendedorNome: p.vendedorNome,
          cpf: colaboradores.find((c) => c.id === p.vendedorId)?.cpf ?? "",
          filial: p.filial,
          total: p.total,
          ...Object.fromEntries(CATEGORIAS_PREMIACAO.map((categoria) => [categoria, p[categoria]])),
        })) as CartaoMesConsulta["linhas"],
    }));

    return resultadoSucesso(cartoes);
  },

  async exportarCSV(filial, _filtro, escopo) {
    garantirSeed();
    const premiacoes = buscarPremiacoes(filial, escopo);
    if (premiacoes.length === 0) return resultadoErro("Não há premiações salvas para exportar.");

    // Mesmas colunas do CSV gerado pelo backend real (Claude/API (15).md), pra manter o
    // adapter mock representativo do que a tela realmente recebe.
    const linhas = premiacoes.map((p) => [
      p.vendedorNome,
      p.pev.toFixed(2),
      p.iconic.toFixed(2),
      p.filtros.toFixed(2),
      p.campanhasFornecedores.toFixed(2),
      p.inadimplencia.toFixed(2),
      p.total.toFixed(2),
    ]);
    baixarCSV(["nome colaborador", "pev", "iconic", "filtros", "fornecedores", "inadimplencia", "total"], linhas, "premiacoes", filial);
    return resultadoSucesso(undefined);
  },
};
