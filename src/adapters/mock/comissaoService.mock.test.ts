import { beforeEach, describe, expect, it } from "vitest";
import { FILIAL_TODAS } from "../../types";
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
    const linha = resultado.status === "sucesso" ? resultado.dados.find((c) => c.vendedorId === "seed-v1") : undefined;
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
    const linha = resultado.status === "sucesso" ? resultado.dados.find((c) => c.vendedorId === "seed-v1") : undefined;
    expect(linha?.pev).toBe(300);
  });

  it("traz o roster inteiro (todo colaborador habilitado, zerado quem não lançou nada) — não só quem já foi salvo", async () => {
    // seed-v1 e seed-v2 são da filial 100, ambos com telas.comissao — só seed-v1 lança nesse mês.
    await comissaoServiceMock.salvarComissao("100", "2026-07", { vendedorId: "seed-v1", valor: 500, garantido: 100 });

    const resultado = await comissaoServiceMock.listarComissoes("100", "2026-07");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados.map((c) => c.vendedorId).sort()).toEqual(["seed-v1", "seed-v2"]);

    const seedV1 = dados.find((c) => c.vendedorId === "seed-v1");
    expect(seedV1?.valor).toBe(500);
    expect(seedV1?.garantido).toBe(100);

    const seedV2 = dados.find((c) => c.vendedorId === "seed-v2");
    expect(seedV2?.valor).toBe(0);
    expect(seedV2?.garantido).toBe(0);
  });

  it("Admin em 'Todas as filiais' lista o roster de todas as filiais e salva com a filial real do colaborador", async () => {
    // seed-v1/v2 são da filial 100, seed-v3 da 401, seed-v4 da 403 — todos com telas.comissao.
    await comissaoServiceMock.salvarComissao(FILIAL_TODAS, "2026-07", { vendedorId: "seed-v1", valor: 500, garantido: 100 });
    await comissaoServiceMock.salvarComissao(FILIAL_TODAS, "2026-07", { vendedorId: "seed-v4", valor: 700, garantido: 150 });

    const todas = await comissaoServiceMock.listarComissoes(FILIAL_TODAS, "2026-07");
    const dados = todas.status === "sucesso" ? todas.dados : [];
    expect(dados.map((c) => c.vendedorId).sort()).toEqual(["seed-v1", "seed-v2", "seed-v3", "seed-v4"]);

    const daFilial100 = await comissaoServiceMock.listarComissoes("100", "2026-07");
    const linha =
      daFilial100.status === "sucesso" ? daFilial100.dados.find((c) => c.vendedorId === "seed-v1") : undefined;
    expect(linha?.filial).toBe("100");
    expect(linha?.valor).toBe(500);
  });
});
