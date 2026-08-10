import { describe, expect, it } from "vitest";
import { gerarIntervaloMeses, obterAnoCicloAtual, obterMesesCicloPEV } from "./periodo";

describe("obterAnoCicloAtual", () => {
  it("usa o ano corrente para meses de janeiro a novembro", () => {
    expect(obterAnoCicloAtual(new Date(2026, 6, 15))).toBe(2026); // julho/2026
  });

  it("usa o ano seguinte quando o mês corrente é dezembro", () => {
    expect(obterAnoCicloAtual(new Date(2026, 11, 1))).toBe(2027); // dezembro/2026
  });
});

describe("obterMesesCicloPEV", () => {
  it("gera as 12 chaves de dezembro do ano anterior a novembro do ano do ciclo", () => {
    const meses = obterMesesCicloPEV(2026);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toBe("2025-12");
    expect(meses[meses.length - 1]).toBe("2026-11");
    expect(meses).toContain("2026-01");
  });
});

describe("gerarIntervaloMeses", () => {
  it("recorta o intervalo [de, ate] inclusive dentro do ciclo", () => {
    expect(gerarIntervaloMeses(2026, "2026-01", "2026-03")).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("inclui dezembro do ano anterior quando faz parte do intervalo", () => {
    expect(gerarIntervaloMeses(2026, "2025-12", "2026-01")).toEqual(["2025-12", "2026-01"]);
  });

  it("retorna vazio se 'de' vier depois de 'ate'", () => {
    expect(gerarIntervaloMeses(2026, "2026-03", "2026-01")).toEqual([]);
  });

  it("retorna vazio para um mês fora do ciclo informado", () => {
    expect(gerarIntervaloMeses(2026, "2024-01", "2026-01")).toEqual([]);
  });
});
