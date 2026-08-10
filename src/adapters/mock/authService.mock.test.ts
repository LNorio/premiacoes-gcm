import { beforeEach, describe, expect, it } from "vitest";
import { authServiceMock } from "./authService.mock";

beforeEach(() => {
  localStorage.clear();
});

describe("authServiceMock.login", () => {
  it("autentica o Admin e devolve FILIAL_TODAS como filial ativa", async () => {
    const resultado = await authServiceMock.login("admin", "admin123");
    expect(resultado).toMatchObject({ status: "sucesso", dados: { role: "admin", filialAtiva: "TODAS" } });
  });

  it("autentica o Gerente na filial 100", async () => {
    const resultado = await authServiceMock.login("gerente", "gerente123");
    expect(resultado).toMatchObject({ status: "sucesso", dados: { role: "gerente", filialAtiva: "100" } });
  });

  it("autentica um vendedor do seed pelo usuarioAcesso/senhaAcesso", async () => {
    const resultado = await authServiceMock.login("carlos.silva", "venda123");
    expect(resultado).toMatchObject({ status: "sucesso", dados: { role: "vendedor", nome: "Carlos Silva" } });
  });

  it("retorna erro para credenciais inválidas", async () => {
    const resultado = await authServiceMock.login("carlos.silva", "senha-errada");
    expect(resultado.status).toBe("erro");
  });
});
