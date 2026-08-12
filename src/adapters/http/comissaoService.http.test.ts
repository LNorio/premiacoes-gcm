import { afterEach, describe, expect, it, vi } from "vitest";
import { comissaoServiceHttp } from "./comissaoService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const USUARIOS_100 = [
  {
    "id colaborador": 4,
    codigo: "V001",
    nome: "Carlos Eduardo Silva",
    cpf: "123.456.789-01",
    funcao: "Consultor de Vendas Interno",
    email: "carlos.silva@comercialmariano.com.br",
    usuario: "carlos.silva",
    role: "vendedor",
    filial: "100",
    "plano saude": true,
    "plano odontologico": false,
    telas: [2],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("comissaoServiceHttp.listarComissoes", () => {
  it("mapeia a resposta de GET /api/comissoes, cruzando a filial com /api/usuarios", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      if (url.includes("/api/comissoes")) {
        return Promise.resolve(
          jsonResponse({
            dados: [
              {
                "id colaborador": 4,
                "nome colaborador": "Carlos Eduardo Silva",
                cpf: "123.456.789-01",
                funcao: "Consultor de Vendas Interno",
                pev: 100,
                comissao: "500.00",
                garantido: "100.00",
              },
            ],
            "total pev": 100,
            "total comissao": 500,
            "total garantido": 100,
          }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await comissaoServiceHttp.listarComissoes("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados).toEqual([
      {
        id: "4-2026-08",
        vendedorId: "4",
        vendedorNome: "Carlos Eduardo Silva",
        filial: "100",
        mesReferencia: "2026-08",
        pev: 100,
        valor: 500,
        garantido: 100,
      },
    ]);

    const chamadaComissoes = fetchMock.mock.calls.map((c) => c[0] as string).find((u) => u.includes("/api/comissoes"))!;
    expect(chamadaComissoes).toContain("mes_de_referencia=2026-08-01");
    expect(chamadaComissoes).toContain("filial=100");
  });
});

describe("comissaoServiceHttp.salvarComissao", () => {
  it("faz PUT /api/comissoes com o corpo esperado e devolve o registro relistado", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "dados salvos com sucesso" }));
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      return Promise.resolve(
        jsonResponse({
          dados: [
            {
              "id colaborador": 4,
              "nome colaborador": "Carlos Eduardo Silva",
              cpf: "123.456.789-01",
              funcao: "Consultor de Vendas Interno",
              pev: 0,
              comissao: "300.00",
              garantido: "50.00",
            },
          ],
          "total pev": 0,
          "total comissao": 300,
          "total garantido": 50,
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await comissaoServiceHttp.salvarComissao("100", "2026-08", { vendedorId: "4", valor: 300, garantido: 50 });
    expect(resultado).toEqual({
      status: "sucesso",
      dados: {
        id: "4-2026-08",
        vendedorId: "4",
        vendedorNome: "Carlos Eduardo Silva",
        filial: "100",
        mesReferencia: "2026-08",
        pev: 0,
        valor: 300,
        garantido: 50,
      },
    });

    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT")!;
    const corpo = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(corpo).toEqual([{ "id colaborador": 4, "mes de referencia": "2026-08-01", comissao: 300, garantido: 50 }]);
  });
});
