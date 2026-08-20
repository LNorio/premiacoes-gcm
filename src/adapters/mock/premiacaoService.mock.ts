import { somarCategoriasPremiacao, type LancamentoPremiacao, type PremiacaoService } from "../../services/premiacaoService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type Premiacao } from "../../types";
import { baixarCSV } from "../../utils/exportar";
import { lerColecao, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "premiacoes";
const ZERADA = { pev: 0, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0, total: 0 };

function buscar(filial: string, mesReferencia: string): Premiacao[] {
  const todas = lerColecao<Premiacao>(CHAVE).filter((p) => p.mesReferencia === mesReferencia);
  return filial === FILIAL_TODAS ? todas : todas.filter((p) => p.filial === filial);
}

/**
 * Roster do mês (`Claude/API (16).md`): uma linha por colaborador com a tela Premiações,
 * usando o lançamento salvo quando existe, zerada quando não — mesmo comportamento que a
 * API real passou a ter quando `data_inicio`/`data_fim` caem no mesmo mês.
 */
function buscarComRoster(filial: string, mesReferencia: string): Premiacao[] {
  const habilitados = lerColecao<Colaborador>("colaboradores").filter(
    (c) => (filial === FILIAL_TODAS || c.filial === filial) && c.telas.premiacoes,
  );
  const existentes = buscar(filial, mesReferencia);
  return habilitados.map((c) => {
    const existente = existentes.find((p) => p.vendedorId === c.id);
    return (
      existente ?? {
        id: `${c.id}-${mesReferencia}`,
        vendedorId: c.id,
        vendedorNome: c.nome,
        codigo: c.codigo,
        filial: c.filial,
        mesReferencia,
        ...ZERADA,
      }
    );
  });
}

export const premiacaoServiceMock: PremiacaoService = {
  async listarPremiacoes(filial, mesReferencia) {
    garantirSeed();
    return resultadoSucesso(buscarComRoster(filial, mesReferencia));
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
        codigo: vendedor?.codigo ?? existente?.codigo ?? "",
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

    return resultadoSucesso(buscarComRoster(filial, mesReferencia));
  },

  async exportarPremiacoesCSV(filial, mesReferencia) {
    garantirSeed();
    const premiacoes = buscar(filial, mesReferencia);
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
