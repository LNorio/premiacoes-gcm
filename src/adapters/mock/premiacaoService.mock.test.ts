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

    const resultado = await premiacaoServiceMock.listarPremiacoes("100", "2026-07");
    expect(resultado.status === "sucesso" && resultado.dados).toHaveLength(1);
    expect(resultado.status === "sucesso" && resultado.dados[0].total).toBe(200);
  });

  it("não mistura lançamentos de meses diferentes", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-06", [
      { vendedorId: "seed-v1", pev: 10, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    const resultadoJulho = await premiacaoServiceMock.listarPremiacoes("100", "2026-07");
    expect(resultadoJulho.status === "sucesso" && resultadoJulho.dados).toHaveLength(0);
  });
});
