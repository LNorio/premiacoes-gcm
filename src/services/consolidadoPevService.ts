import type { Premiacao, Resultado } from "../types";

export interface LinhaConsolidadoPev {
  vendedorId: string;
  vendedorNome: string;
  cpf: string;
  filial: string;
  /** valor de PEV por mês do intervalo filtrado, chaveado por "YYYY-MM" */
  porMes: Record<string, number>;
  totalAcumulado: number;
  baseCalculo: number;
  adiantamento: number;
  premiacaoAdicionalReceber: number;
}

export interface ConsolidadoPevService {
  listarConsolidadoPev(filial: string, anoCiclo: number, meses: string[]): Promise<Resultado<LinhaConsolidadoPev[]>>;
  salvarAdiantamento(vendedorId: string, anoCiclo: number, valor: number): Promise<Resultado<void>>;
}

/** Ver documento técnico, Seção 3.3 — Base de Cálculo = Total Acumulado × 0,28 */
export const PERCENTUAL_BASE_CALCULO_PEV = 0.28;

export function calcularBaseCalculoPev(totalAcumulado: number): number {
  return totalAcumulado * PERCENTUAL_BASE_CALCULO_PEV;
}

export function calcularPremiacaoAdicionalReceber(baseCalculo: number, adiantamento: number): number {
  return baseCalculo - adiantamento;
}

export function obterPevDaPremiacao(premiacoesDoMes: Pick<Premiacao, "vendedorId" | "pev">[], vendedorId: string): number {
  return premiacoesDoMes.find((p) => p.vendedorId === vendedorId)?.pev ?? 0;
}
