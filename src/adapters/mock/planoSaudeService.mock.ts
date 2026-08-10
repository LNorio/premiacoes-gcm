import type { PlanoSaudeService } from "../../services/planoSaudeService";
import { FILIAL_TODAS, resultadoSucesso, type Colaborador, type PlanoSaudeDependente, type PlanoSaudeLancamento } from "../../types";
import { gravarColecao, lerColecao, removerPorId, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE_DEPENDENTES = "planoSaudeDependentes";
const CHAVE_LANCAMENTOS = "planoSaudeLancamentos";

export const planoSaudeServiceMock: PlanoSaudeService = {
  async listarDependentes(titularId) {
    garantirSeed();
    return resultadoSucesso(lerColecao<PlanoSaudeDependente>(CHAVE_DEPENDENTES).filter((d) => d.vendedorId === titularId));
  },

  async salvarDependente(dependente) {
    garantirSeed();
    const salvo = upsertPorId<PlanoSaudeDependente>(CHAVE_DEPENDENTES, { ...dependente, id: dependente.id ?? "" }, "dep");
    return resultadoSucesso(salvo);
  },

  async removerDependente(id) {
    garantirSeed();
    removerPorId(CHAVE_DEPENDENTES, id);
    return resultadoSucesso(undefined);
  },

  async salvarAdesao(titularId, tipo, valor) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores");
    const campo = tipo === "saude" ? "adesaoSaude" : "adesaoOdontologico";
    gravarColecao(
      "colaboradores",
      colaboradores.map((c) => (c.id === titularId ? { ...c, [campo]: valor } : c)),
    );
    return resultadoSucesso(undefined);
  },

  async listarLancamentosPlanoSaude(filial, mesReferencia, tipo) {
    garantirSeed();
    const colaboradores = lerColecao<Colaborador>("colaboradores");
    const titulares = filial === FILIAL_TODAS ? colaboradores : colaboradores.filter((c) => c.filial === filial);
    const idsTitulares = new Set(titulares.map((t) => t.id));
    const dependentes = lerColecao<PlanoSaudeDependente>(CHAVE_DEPENDENTES).filter((d) => idsTitulares.has(d.vendedorId));
    const idsPessoas = new Set([...idsTitulares, ...dependentes.map((d) => d.id)]);

    const lancamentos = lerColecao<PlanoSaudeLancamento>(CHAVE_LANCAMENTOS).filter(
      (l) => l.mesReferencia === mesReferencia && l.tipoPlano === tipo && idsPessoas.has(l.pessoaId),
    );
    return resultadoSucesso(lancamentos);
  },

  async salvarLancamentoPlanoSaude(lancamento) {
    garantirSeed();
    const existente = lerColecao<PlanoSaudeLancamento>(CHAVE_LANCAMENTOS).find(
      (l) => l.pessoaId === lancamento.pessoaId && l.mesReferencia === lancamento.mesReferencia && l.tipoPlano === lancamento.tipoPlano,
    );
    const salvo = upsertPorId<PlanoSaudeLancamento>(
      CHAVE_LANCAMENTOS,
      { ...lancamento, id: existente?.id || lancamento.id || "" },
      "ps",
    );
    return resultadoSucesso(salvo);
  },
};
