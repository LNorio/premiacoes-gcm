import { afterEach, describe, expect, it, vi } from "vitest";
import { comissaoServiceHttp } from "./comissaoService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("comissaoServiceHttp.listarComissoes", () => {
  it("mapeia a resposta de GET /api/comissoes usando codigo/cpf/filial da própria resposta, sem chamar /api/usuarios", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        dados: [
          {
            "id colaborador": 4,
            codigo: "V001",
            "nome colaborador": "Carlos Eduardo Silva",
            cpf: "123.456.789-01",
            filial: "100",
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
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await comissaoServiceHttp.listarComissoes("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados).toEqual([
      {
        id: "4-2026-08",
        vendedorId: "4",
        vendedorNome: "Carlos Eduardo Silva",
        codigo: "V001",
        cpf: "123.456.789-01",
        cargo: "Consultor de Vendas Interno",
        filial: "100",
        mesReferencia: "2026-08",
        pev: 100,
        valor: 500,
        garantido: 100,
      },
    ]);

    // uma única chamada, sem passar por /api/usuarios (Claude/API (19).md — roster completo já vem pronto)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const chamadaComissoes = fetchMock.mock.calls[0][0] as string;
    expect(chamadaComissoes).toContain("/api/comissoes");
    expect(chamadaComissoes).toContain("mes_de_referencia=2026-08-01");
    expect(chamadaComissoes).toContain("filial=100");
  });

  it("traz colaborador do roster sem comissão lançada ainda (comissao/garantido zerados)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        dados: [
          {
            "id colaborador": 9,
            codigo: "V009",
            "nome colaborador": "Alguém Sem Lançamento",
            cpf: "999.999.999-99",
            filial: "100",
            funcao: "Consultor de Vendas Externa",
            pev: 0,
            comissao: 0,
            garantido: 0,
          },
        ],
        "total pev": 0,
        "total comissao": 0,
        "total garantido": 0,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await comissaoServiceHttp.listarComissoes("100", "2026-08");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados[0]).toMatchObject({ vendedorId: "9", valor: 0, garantido: 0 });
  });
});

describe("comissaoServiceHttp.salvarComissao", () => {
  it("faz PUT /api/comissoes com o corpo esperado e devolve o registro relistado", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "dados salvos com sucesso" }));
      return Promise.resolve(
        jsonResponse({
          dados: [
            {
              "id colaborador": 4,
              codigo: "V001",
              "nome colaborador": "Carlos Eduardo Silva",
              cpf: "123.456.789-01",
              filial: "100",
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
        codigo: "V001",
        cpf: "123.456.789-01",
        cargo: "Consultor de Vendas Interno",
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

describe("comissaoServiceHttp.exportarCSV", () => {
  it("busca o CSV pronto do backend (GET /api/comissoes/exportar-csv) e dispara o download", async () => {
    const base64 = btoa('"nome colaborador";cpf;funcao;comissao;garantido\n"Carlos";"123.456.789-01";Vendedor;500.00;100.00');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const resultado = await comissaoServiceHttp.exportarCSV("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/comissoes/exportar-csv");
    expect(url).toContain("mes_de_referencia=2026-08-01");
    expect(url).toContain("filial=100");
  });

  it("sem comissão salva nenhuma, devolve erro em vez de baixar um arquivo vazio", async () => {
    const base64 = btoa('"nome colaborador";cpf;funcao;comissao;garantido');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await comissaoServiceHttp.exportarCSV("100", "2026-08");
    expect(resultado.status).toBe("erro");
  });
});
