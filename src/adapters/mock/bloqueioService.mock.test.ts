import { beforeEach, describe, expect, it } from "vitest";
import { bloqueioServiceMock } from "./bloqueioService.mock";

beforeEach(() => {
  localStorage.clear();
});

describe("bloqueioServiceMock", () => {
  it("não está bloqueado por padrão", async () => {
    const resultado = await bloqueioServiceMock.consultarBloqueio("premiacao", "100", "2026-07");
    expect(resultado).toMatchObject({ status: "sucesso", dados: false });
  });

  it("alternarBloqueio liga e desliga o bloqueio", async () => {
    const ligou = await bloqueioServiceMock.alternarBloqueio("premiacao", "100", "2026-07");
    expect(ligou).toMatchObject({ status: "sucesso", dados: true });

    const consultaLigado = await bloqueioServiceMock.consultarBloqueio("premiacao", "100", "2026-07");
    expect(consultaLigado).toMatchObject({ status: "sucesso", dados: true });

    const desligou = await bloqueioServiceMock.alternarBloqueio("premiacao", "100", "2026-07");
    expect(desligou).toMatchObject({ status: "sucesso", dados: false });
  });

  it("bloqueio é isolado por tela::filial::mês", async () => {
    await bloqueioServiceMock.alternarBloqueio("premiacao", "100", "2026-07");
    const outraFilial = await bloqueioServiceMock.consultarBloqueio("premiacao", "200", "2026-07");
    expect(outraFilial).toMatchObject({ status: "sucesso", dados: false });
  });
});
