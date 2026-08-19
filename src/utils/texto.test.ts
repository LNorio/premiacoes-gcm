import { describe, expect, it } from "vitest";
import { normalizarBusca } from "./texto";

describe("normalizarBusca", () => {
  it("ignora maiúscula/minúscula", () => {
    expect(normalizarBusca("Carlos")).toBe(normalizarBusca("CARLOS"));
  });

  it("ignora acentos", () => {
    expect(normalizarBusca("José")).toBe(normalizarBusca("jose"));
  });

  it("remove espaços nas pontas", () => {
    expect(normalizarBusca("  carlos  ")).toBe("carlos");
  });
});
