import { somarCategoriasPremiacao, type LancamentoPremiacao, type PremiacaoService } from "../../services/premiacaoService";
import { FILIAL_TODAS, resultadoSucesso, type Colaborador, type Premiacao } from "../../types";
import { lerColecao, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "premiacoes";

function buscar(filial: string, mesReferencia: string): Premiacao[] {
  const todas = lerColecao<Premiacao>(CHAVE).filter((p) => p.mesReferencia === mesReferencia);
  return filial === FILIAL_TODAS ? todas : todas.filter((p) => p.filial === filial);
}

export const premiacaoServiceMock: PremiacaoService = {
  async listarPremiacoes(filial, mesReferencia) {
    garantirSeed();
    return resultadoSucesso(buscar(filial, mesReferencia));
  },

  async salvarPremiacoes(filial, mesReferencia, linhas: LancamentoPremiacao[]) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores");
    const existentes = buscar(filial, mesReferencia);

    for (const linha of linhas) {
      const vendedor = colaboradores.find((c) => c.id === linha.vendedorId);
      const existente = existentes.find((p) => p.vendedorId === linha.vendedorId);
      const registro: Premiacao = {
        id: existente?.id ?? "",
        vendedorId: linha.vendedorId,
        vendedorNome: vendedor?.nome ?? existente?.vendedorNome ?? "",
        // Em "Todas as filiais" (Admin), cada lançamento vai para a filial real do colaborador.
        filial: vendedor?.filial ?? existente?.filial ?? filial,
        mesReferencia,
        pev: linha.pev,
        iconic: linha.iconic,
        filtros: linha.filtros,
        campanhasFornecedores: linha.campanhasFornecedores,
        inadimplencia: linha.inadimplencia,
        total: somarCategoriasPremiacao(linha),
      };
      upsertPorId(CHAVE, registro, "prem");
    }

    return resultadoSucesso(buscar(filial, mesReferencia));
  },
};
