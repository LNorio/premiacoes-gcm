import type { EstoqueService } from "../../services/estoqueService";
import { resultadoSucesso, type Colaborador, type EstoqueColetivoMensal, type EstoqueIndividualMensal, type PoliticaEstoque } from "../../types";
import { gravarValor, lerColecao, lerValor, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE_POLITICA = "politicaEstoque";
const CHAVE_COLETIVO = "estoqueColetivoMensal";
const CHAVE_INDIVIDUAL = "estoqueIndividualMensal";

const POLITICA_PADRAO: PoliticaEstoque = {
  metas: { romaneios: 0.9, contagens: 3, avaria: 0.0015, segregado: 0 },
  valoresReferencia: { romaneios: 150, contagens: 100, avaria: 75, segregado: 25, faltas: 75, organizacao: 75, volumeSeparado: 150 },
  metaVolumeSeparadoTotal: 0.8,
};

export const estoqueServiceMock: EstoqueService = {
  async obterPolitica() {
    garantirSeed();
    return resultadoSucesso(lerValor(CHAVE_POLITICA, POLITICA_PADRAO));
  },

  async salvarPolitica(politica) {
    garantirSeed();
    gravarValor(CHAVE_POLITICA, politica);
    return resultadoSucesso(politica);
  },

  async listarColetivo(filial, mesReferencia) {
    garantirSeed();
    return resultadoSucesso(
      lerColecao<EstoqueColetivoMensal>(CHAVE_COLETIVO).filter((r) => r.filial === filial && r.mesReferencia === mesReferencia),
    );
  },

  async salvarColetivo(registro) {
    garantirSeed();
    const existente = lerColecao<EstoqueColetivoMensal>(CHAVE_COLETIVO).find(
      (r) => r.filial === registro.filial && r.mesReferencia === registro.mesReferencia,
    );
    const salvo = upsertPorId<EstoqueColetivoMensal>(CHAVE_COLETIVO, { ...registro, id: existente?.id || registro.id || "" }, "estcol");
    return resultadoSucesso(salvo);
  },

  async listarIndividual(filial, mesReferencia) {
    garantirSeed();
    const idsFilial = new Set(lerColecao<Colaborador>("colaboradores").filter((c) => c.filial === filial).map((c) => c.id));
    return resultadoSucesso(
      lerColecao<EstoqueIndividualMensal>(CHAVE_INDIVIDUAL).filter(
        (r) => r.mesReferencia === mesReferencia && idsFilial.has(r.vendedorId),
      ),
    );
  },

  async salvarIndividual(registro) {
    garantirSeed();
    const existente = lerColecao<EstoqueIndividualMensal>(CHAVE_INDIVIDUAL).find(
      (r) => r.vendedorId === registro.vendedorId && r.mesReferencia === registro.mesReferencia,
    );
    const salvo = upsertPorId<EstoqueIndividualMensal>(
      CHAVE_INDIVIDUAL,
      { ...registro, id: existente?.id || registro.id || "" },
      "estind",
    );
    return resultadoSucesso(salvo);
  },
};
