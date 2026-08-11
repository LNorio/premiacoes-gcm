import { describe, expect, it } from "vitest";
import { gerarIntervaloMeses, nomeCurtoMes, obterAnoCicloAtual, obterMesAtualISO, obterMesesCicloPEV, ultimoDiaDoMes } from "./periodo";

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
  it("gera os meses entre 'de' e 'ate' (inclusive), cronologicamente", () => {
    expect(gerarIntervaloMeses("2026-01", "2026-03")).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("atravessa a virada de ano normalmente", () => {
    expect(gerarIntervaloMeses("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("não fica preso ao ciclo Dez-Nov — aceita qualquer intervalo, mesmo de anos distantes", () => {
    expect(gerarIntervaloMeses("2024-06", "2024-08")).toEqual(["2024-06", "2024-07", "2024-08"]);
  });

  it("retorna vazio se 'de' vier depois de 'ate'", () => {
    expect(gerarIntervaloMeses("2026-03", "2026-01")).toEqual([]);
  });

  it("retorna um único mês quando de === ate", () => {
    expect(gerarIntervaloMeses("2026-05", "2026-05")).toEqual(["2026-05"]);
  });
});

describe("obterMesAtualISO", () => {
  it("formata a data informada como 'YYYY-MM'", () => {
    expect(obterMesAtualISO(new Date(2026, 6, 15))).toBe("2026-07");
  });
});

describe("nomeCurtoMes", () => {
  it("retorna a abreviação de 3 letras do mês", () => {
    expect(nomeCurtoMes("2026-01")).toBe("jan");
    expect(nomeCurtoMes("2026-12")).toBe("dez");
  });
});

describe("ultimoDiaDoMes", () => {
  it("retorna o último dia de meses com 31, 30 e 28/29 dias", () => {
    expect(ultimoDiaDoMes("2026-01")).toBe("2026-01-31");
    expect(ultimoDiaDoMes("2026-04")).toBe("2026-04-30");
    expect(ultimoDiaDoMes("2026-02")).toBe("2026-02-28");
    expect(ultimoDiaDoMes("2028-02")).toBe("2028-02-29"); // ano bissexto
  });
});
