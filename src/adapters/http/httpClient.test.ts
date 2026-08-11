import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroHttp, HttpClient } from "./httpClient";

describe("HttpClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("faz GET sem Authorization quando não há token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste" });
    const resultado = await client.get<{ ok: boolean }>("/rota");

    expect(resultado).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("http://api.teste/rota");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("injeta Authorization: Bearer quando obterToken devolve um token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste", obterToken: () => "abc123" });
    await client.post("/rota", { a: 1 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(init.headers.Authorization).toBe("Bearer abc123");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('lança ErroHttp com a mensagem do corpo ("mensagem") quando a resposta não é ok', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ mensagem: "credenciais inválidas" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste" });
    await expect(client.get("/rota")).rejects.toMatchObject({ message: "credenciais inválidas", status: 401 });
  });

  it("usa mensagem genérica quando o corpo de erro não é JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("erro cru", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste" });
    await expect(client.get("/rota")).rejects.toMatchObject({ message: "Falha na requisição: 500", status: 500 });
  });

  it("chama aoReceber401 quando a resposta é 401", async () => {
    const aoReceber401 = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ mensagem: "expirado" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste", aoReceber401 });
    await expect(client.get("/rota")).rejects.toBeInstanceOf(ErroHttp);
    expect(aoReceber401).toHaveBeenCalledTimes(1);
  });

  it("devolve undefined em respostas 204", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "http://api.teste" });
    await expect(client.delete("/rota")).resolves.toBeUndefined();
  });
});
