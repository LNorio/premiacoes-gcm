import { beforeEach, describe, expect, it } from "vitest";
import { premiacaoServiceMock } from "./premiacaoService.mock";

beforeEach(() => {
  localStorage.clear();
});

describe("premiacaoServiceMock", () => {
  it("salva e recalcula o total como soma das 5 categorias", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 100, iconic: 50, filtros: 25, campanhasFornecedores: 10, inadimplencia: -5 },
    ]);

    const resultado = await premiacaoServiceMock.listarPremiacoes("100", "2026-07");
    expect(resultado.status).toBe("sucesso");
    const linha = resultado.status === "sucesso" ? resultado.dados[0] : undefined;
    expect(linha?.total).toBe(180);
    expect(linha?.vendedorNome).toBe("Carlos Silva");
  });

  it("atualiza (não duplica) ao salvar novamente o mesmo vendedor/mês", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 200, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    // Roster do mês (Claude/API (16).md): Carlos (seed-v1) e Fernanda são os 2 habilitados
    // pra Premiações na filial 100 — Fernanda aparece zerada, não duplicada.
    const resultado = await premiacaoServiceMock.listarPremiacoes("100", "2026-07");
    expect(resultado.status === "sucesso" && resultado.dados).toHaveLength(2);
    const carlos = resultado.status === "sucesso" && resultado.dados.find((p) => p.vendedorId === "seed-v1");
    expect(carlos && carlos.total).toBe(200);
  });

  it("não mistura lançamentos de meses diferentes (mês sem lançamento aparece zerado, não some do roster)", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-06", [
      { vendedorId: "seed-v1", pev: 10, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    const resultadoJulho = await premiacaoServiceMock.listarPremiacoes("100", "2026-07");
    const carlosEmJulho =
      resultadoJulho.status === "sucesso" && resultadoJulho.dados.find((p) => p.vendedorId === "seed-v1");
    expect(carlosEmJulho && carlosEmJulho.total).toBe(0);
  });
});
