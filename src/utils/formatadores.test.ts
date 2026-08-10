import { describe, expect, it } from "vitest";
import { formatarMesReferencia, formatarMoeda, mascararCpf } from "./formatadores";

describe("formatarMoeda", () => {
  it("formata em BRL com duas casas decimais", () => {
    expect(formatarMoeda(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata zero corretamente", () => {
    expect(formatarMoeda(0)).toBe("R$ 0,00");
  });
});

describe("formatarMesReferencia", () => {
  it("converte 'YYYY-MM' para mês por extenso", () => {
    expect(formatarMesReferencia("2026-07")).toBe("julho de 2026");
  });
});

describe("mascararCpf", () => {
  it("aplica a máscara 000.000.000-00 a partir de dígitos crus", () => {
    expect(mascararCpf("11122233344")).toBe("111.222.333-44");
  });

  it("ignora caracteres não numéricos na entrada", () => {
    expect(mascararCpf("111.222.333-44")).toBe("111.222.333-44");
  });

  it("lida com entrada parcial sem quebrar", () => {
    expect(mascararCpf("111")).toBe("111");
  });
});
