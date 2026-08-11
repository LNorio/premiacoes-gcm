import { beforeEach, describe, expect, it, vi } from "vitest";
import { authServiceHttp } from "./authService.http";
import { definirToken, obterToken } from "./token";

beforeEach(() => {
  definirToken(null);
  vi.unstubAllGlobals();
});

describe("authServiceHttp.login", () => {
  it("faz POST /api/valida-usuario e mapeia a resposta da API para Sessao, guardando o token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          "id colaborador": 1,
          codigo: "V001",
          funcao: "Consultor de Vendas Interno",
          nome: "Carlos Eduardo Silva",
          role: "vendedor",
          filial: "100",
          "quantidade de premiacoes": 3,
          "valor premiacoes": 1250,
          token: "1|abcdef",
          mensagem: "usuario encontrado",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await authServiceHttp.login("carlos.silva", "venda123");

    expect(resultado).toEqual({
      status: "sucesso",
      dados: { role: "vendedor", nome: "Carlos Eduardo Silva", vendedorId: "1", filialAtiva: "100" },
    });
    expect(obterToken()).toBe("1|abcdef");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toContain("/api/valida-usuario");
    expect(JSON.parse(init.body as string)).toEqual({ usuario: "carlos.silva", senha: "venda123" });
    expect(init.headers.Authorization).toBeUndefined(); // /valida-usuario não exige token
  });

  it("devolve erro com a mensagem da API quando as credenciais são inválidas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ mensagem: "usuario ou senha invalidos" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await authServiceHttp.login("errado", "errado");
    expect(resultado).toEqual({ status: "erro", mensagem: "usuario ou senha invalidos" });
    expect(obterToken()).toBeNull();
  });

  it("devolve mensagem genérica quando a chamada falha por rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const resultado = await authServiceHttp.login("carlos.silva", "venda123");
    expect(resultado).toEqual({
      status: "erro",
      mensagem: "Não foi possível conectar ao servidor. Tente novamente.",
    });
  });
});

describe("authServiceHttp.logout", () => {
  it("limpa o token guardado no login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ "id colaborador": 1, nome: "Administrador", role: "admin", filial: "TODAS", token: "abc", mensagem: "ok" }),
          { status: 200 },
        ),
      ),
    );
    await authServiceHttp.login("admin", "admin123");
    expect(obterToken()).toBe("abc");

    await authServiceHttp.logout();
    expect(obterToken()).toBeNull();
  });
});
