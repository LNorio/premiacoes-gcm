import { beforeEach, describe, expect, it } from "vitest";
import { comissaoServiceMock } from "./comissaoService.mock";
import { premiacaoServiceMock } from "./premiacaoService.mock";

beforeEach(() => {
  localStorage.clear();
});

describe("comissaoServiceMock", () => {
  it("grava o PEV da Premiação como snapshot ao salvar (documento técnico, Seção 3.5)", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 300, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    await comissaoServiceMock.salvarComissao("100", "2026-07", { vendedorId: "seed-v1", valor: 500, garantido: 100 });

    const resultado = await comissaoServiceMock.listarComissoes("100", "2026-07");
    const linha = resultado.status === "sucesso" ? resultado.dados[0] : undefined;
    expect(linha?.pev).toBe(300);
    expect(linha?.valor).toBe(500);
  });

  it("o snapshot de PEV não muda depois se a Premiação for alterada", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 300, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    await comissaoServiceMock.salvarComissao("100", "2026-07", { vendedorId: "seed-v1", valor: 500, garantido: 100 });

    // Premiação muda depois de a comissão já ter sido salva
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 999, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    const resultado = await comissaoServiceMock.listarComissoes("100", "2026-07");
    const linha = resultado.status === "sucesso" ? resultado.dados[0] : undefined;
    expect(linha?.pev).toBe(300);
  });
});
