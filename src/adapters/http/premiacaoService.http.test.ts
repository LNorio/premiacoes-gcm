import { afterEach, describe, expect, it, vi } from "vitest";
import { premiacaoServiceHttp } from "./premiacaoService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("premiacaoServiceHttp.listarPremiacoes", () => {
  it("faz uma única requisição pra filial inteira (sem ?id= nem /api/usuarios) — a API já filtra por acesso à tela e traz o roster do mês", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        periodo: "2026-08-01 a 2026-08-31",
        total: 163,
        meses: [
          {
            "mes de referencia": "2026-08-01",
            "mes formatado": "Agosto de 2026",
            "quantidade lancamentos": 2,
            subtotal: 163,
            dados: [
              {
                "id colaborador": 4,
                codigo: "V001",
                "nome colaborador": "Carlos Eduardo Silva",
                filial: "100",
                pev: "100.00",
                iconic: "50.00",
                filtros: "10.00",
                fornecedores: "5.00",
                inadimplencia: "-2.00",
                total: 163,
              },
              // Roster do mês (Claude/API (16).md): Fernanda tem a tela Premiações mas
              // ainda não lançou nada — vem zerada, não ausente.
              {
                "id colaborador": 5,
                codigo: "V002",
                "nome colaborador": "Fernanda Souza Lima",
                filial: "100",
                pev: "0.00",
                iconic: "0.00",
                filtros: "0.00",
                fornecedores: "0.00",
                inadimplencia: "0.00",
                total: 0,
              },
            ],
            totais: { pev: 100, iconic: 50, filtros: 10, fornecedores: 5, inadimplencia: -2, total: 163 },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await premiacaoServiceHttp.listarPremiacoes("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados).toHaveLength(2);

    const carlos = dados.find((p) => p.vendedorId === "4")!;
    expect(carlos).toMatchObject({
      vendedorId: "4",
      vendedorNome: "Carlos Eduardo Silva",
      codigo: "V001",
      filial: "100",
      mesReferencia: "2026-08",
      pev: 100,
      iconic: 50,
      filtros: 10,
      campanhasFornecedores: 5,
      inadimplencia: -2,
      total: 163,
    });

    const fernanda = dados.find((p) => p.vendedorId === "5")!;
    expect(fernanda).toMatchObject({ vendedorNome: "Fernanda Souza Lima", codigo: "V002", pev: 0, total: 0 });

    // uma única chamada, sem ?id= e sem nenhuma chamada a /api/usuarios
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).toContain("/api/premiacoes");
    expect(chamada).not.toContain("id=");
    expect(chamada).toContain("data_inicio=2026-08-01");
    expect(chamada).toContain("data_fim=2026-08-31");
  });

  it("mês sem nenhum roster (ex.: filial sem ninguém habilitado) devolve lista vazia, sem quebrar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ periodo: "", total: 0, meses: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await premiacaoServiceHttp.listarPremiacoes("100", "2026-08");
    expect(resultado.status === "sucesso" && resultado.dados).toEqual([]);
  });

  it("omite o parâmetro filial quando 'TODAS' (Admin em Todas as filiais)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ periodo: "", total: 0, meses: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await premiacaoServiceHttp.listarPremiacoes("TODAS", "2026-08");
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).not.toContain("filial=");
  });
});

describe("premiacaoServiceHttp.salvarPremiacoes", () => {
  it("faz PUT /api/premiacoes com o corpo esperado e depois relista", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "dados cadastrados com sucesso" }));
      return Promise.resolve(jsonResponse({ periodo: "", total: 0, meses: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await premiacaoServiceHttp.salvarPremiacoes("100", "2026-08", [
      { vendedorId: "4", pev: 100, iconic: 50, filtros: 10, campanhasFornecedores: 5, inadimplencia: -2 },
    ]);

    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT")!;
    const corpo = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(corpo).toEqual({
      mes_de_referencia: "2026-08-01",
      dados: [
        {
          "id colaborador": 4,
          "mes de referencia": "2026-08-01",
          pev: 100,
          "premiacao iconic": 50,
          filtros: 10,
          "campanhas de fornecedores": 5,
          inadimplencia: -2,
        },
      ],
    });
  });
});

describe("premiacaoServiceHttp.exportarPremiacoesCSV", () => {
  it("busca o CSV pronto do backend, decodifica o base64/UTF-8 e dispara o download", async () => {
    // "nome colaborador";pev;total\n"Carlos Eduardo Silva";100.00;100.00 (com acentuação, testando UTF-8)
    const csvComAcento = '"nome colaborador";pev;total\n"João Ávila";100.00;100.00';
    const base64 = btoa(unescape(encodeURIComponent(csvComAcento)));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "arquivo exportado com sucesso" }));
    vi.stubGlobal("fetch", fetchMock);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const resultado = await premiacaoServiceHttp.exportarPremiacoesCSV("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).toContain("/api/premiacoes/exportar-csv");
    expect(chamada).toContain("filial=100");
    expect(chamada).toContain("data_inicio=2026-08-01");
    expect(chamada).toContain("data_fim=2026-08-31");
  });

  it("sem lançamento nenhum (CSV só com cabeçalho), devolve erro em vez de baixar um arquivo vazio", async () => {
    const base64 = btoa('"nome colaborador";pev;iconic;filtros;fornecedores;inadimplencia;total');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "arquivo exportado com sucesso" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await premiacaoServiceHttp.exportarPremiacoesCSV("100", "2026-08");
    expect(resultado.status).toBe("erro");
  });
});
