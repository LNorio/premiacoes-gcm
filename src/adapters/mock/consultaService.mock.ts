import type { CartaoMesConsulta, ConsultaService } from "../../services/consultaService";
import { CATEGORIAS_PREMIACAO, FILIAL_TODAS, resultadoSucesso, type Colaborador, type Premiacao } from "../../types";
import { lerColecao } from "./db";
import { garantirSeed } from "./seed";

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
};
