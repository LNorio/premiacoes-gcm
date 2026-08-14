import type { PlanoSaudeService } from "../../services/planoSaudeService";
import {
  FILIAL_TODAS,
  resultadoErro,
  resultadoSucesso,
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
} from "../../types";
import { gravarColecao, lerColecao, removerPorId, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE_DEPENDENTES = "planoSaudeDependentes";
const CHAVE_LANCAMENTOS = "planoSaudeLancamentos";
const CHAVE_PERIODOS = "planoSaudePeriodos";

function hojeData(): string {
  return new Date().toISOString().slice(0, 10);
}

function agora(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

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

  async listarPeriodosPlanoSaude(filial, tipoPlano) {
    garantirSeed();
    return resultadoSucesso(
      lerColecao<PlanoSaudePeriodo>(CHAVE_PERIODOS).filter(
        (p) => p.tipoPlano === tipoPlano && (filial === FILIAL_TODAS || p.filial === filial),
      ),
    );
  },

  async salvarPeriodoPlanoSaude(filial, tipoPlano, tipoPessoa, valor) {
    garantirSeed();
    const periodos = lerColecao<PlanoSaudePeriodo>(CHAVE_PERIODOS);
    const jaTemVigente = periodos.some(
      (p) => p.filial === filial && p.tipoPlano === tipoPlano && p.tipoPessoa === tipoPessoa && p.ativo,
    );
    if (jaTemVigente) {
      return resultadoErro(
        "Já existe um período vigente para esta filial, tipo de plano e tipo de pessoa — encerre o atual antes de cadastrar um novo.",
      );
    }
    const novo: PlanoSaudePeriodo = {
      id: "",
      filial,
      tipoPlano,
      tipoPessoa,
      valor,
      ativo: true,
      dataCriacao: agora(),
      dataValidade: null,
    };
    const salvo = upsertPorId<PlanoSaudePeriodo>(CHAVE_PERIODOS, novo, "psp");
    return resultadoSucesso(salvo);
  },

  async encerrarPeriodoPlanoSaude(periodo) {
    garantirSeed();
    const periodos = lerColecao<PlanoSaudePeriodo>(CHAVE_PERIODOS);
    const atual = periodos.find((p) => p.id === periodo.id);
    if (!atual) return resultadoErro("Período não encontrado.");
    if (!atual.ativo) return resultadoErro("Este período já está encerrado.");
    const encerrado: PlanoSaudePeriodo = { ...atual, ativo: false, dataValidade: hojeData() };
    gravarColecao(
      CHAVE_PERIODOS,
      periodos.map((p) => (p.id === periodo.id ? encerrado : p)),
    );
    return resultadoSucesso(encerrado);
  },
};
