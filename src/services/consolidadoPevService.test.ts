import { describe, expect, it } from "vitest";
import { calcularBaseCalculoPev, calcularPremiacaoAdicionalReceber, obterPevDaPremiacao } from "./consolidadoPevService";

describe("calcularBaseCalculoPev", () => {
  it("calcula 28% do total acumulado (documento técnico, Seção 3.3)", () => {
    expect(calcularBaseCalculoPev(1000)).toBeCloseTo(280);
  });
});

describe("calcularPremiacaoAdicionalReceber", () => {
  it("subtrai o adiantamento da base de cálculo", () => {
    expect(calcularPremiacaoAdicionalReceber(280, 100)).toBe(180);
  });

  it("pode resultar em valor negativo se o adiantamento superar a base", () => {
    expect(calcularPremiacaoAdicionalReceber(280, 400)).toBe(-120);
  });
});

describe("obterPevDaPremiacao", () => {
  const premiacoes = [
    { vendedorId: "v1", pev: 150 },
    { vendedorId: "v2", pev: 90 },
  ];

  it("retorna o PEV do vendedor informado", () => {
    expect(obterPevDaPremiacao(premiacoes, "v2")).toBe(90);
  });

  it("retorna 0 quando o vendedor não tem registro no mês", () => {
    expect(obterPevDaPremiacao(premiacoes, "inexistente")).toBe(0);
  });
});
