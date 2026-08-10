import { describe, expect, it } from "vitest";
import { somarCategoriasPremiacao } from "./premiacaoService";

describe("somarCategoriasPremiacao", () => {
  it("soma as 5 categorias (documento técnico, Seção 3.2)", () => {
    const total = somarCategoriasPremiacao({
      pev: 100,
      iconic: 50,
      filtros: 25,
      campanhasFornecedores: 10,
      inadimplencia: -5,
    });
    expect(total).toBe(180);
  });

  it("soma zero quando todas as categorias são zero", () => {
    const total = somarCategoriasPremiacao({ pev: 0, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 });
    expect(total).toBe(0);
  });
});
