export type GrupoFuncaoEstoque = "encarregado_assistente" | "auxiliar";

export interface PoliticaEstoque {
  metas: {
    romaneios: number;
    contagens: number;
    avaria: number;
    segregado: number;
  };
  valoresReferencia: {
    romaneios: number;
    contagens: number;
    avaria: number;
    segregado: number;
    faltas: number;
    organizacao: number;
    volumeSeparado: number;
  };
  metaVolumeSeparadoTotal: number;
}

export const KPIS_COLETIVOS_ESTOQUE = ["romaneios", "contagens", "avaria", "segregado"] as const;
export type KpiColetivoEstoque = (typeof KPIS_COLETIVOS_ESTOQUE)[number];

/** Um registro por filial/mês, com o realizado de cada KPI coletivo */
export interface EstoqueColetivoMensal {
  id: string;
  filial: string;
  mesReferencia: string;
  romaneios: number;
  contagens: number;
  avaria: number;
  segregado: number;
}

/** Um registro por colaborador/mês */
export interface EstoqueIndividualMensal {
  id: string;
  vendedorId: string;
  mesReferencia: string;
  semFaltas: boolean;
  organizacaoOk: boolean;
  volumeSeparadoRealizado: number;
  diasFerias: number;
}
