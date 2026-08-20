import { afterEach, describe, expect, it, vi } from "vitest";
import { consultaServiceHttp } from "./consultaService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("consultaServiceHttp.listarConsulta", () => {
  it("agrupa em um cartão por mês, com uma linha por colaborador, sem chamar /api/usuarios", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        periodo: "2026-07-01 a 2026-08-31",
        total: 313,
        meses: [
          {
            "mes de referencia": "2026-08-01",
            "mes formatado": "Agosto de 2026",
            "quantidade lancamentos": 1,
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
            ],
            totais: { pev: 100, iconic: 50, filtros: 10, fornecedores: 5, inadimplencia: -2, total: 163 },
          },
          {
            "mes de referencia": "2026-07-01",
            "mes formatado": "Julho de 2026",
            "quantidade lancamentos": 1,
            subtotal: 150,
            dados: [
              {
                "id colaborador": 4,
                codigo: "V001",
                "nome colaborador": "Carlos Eduardo Silva",
                filial: "100",
                pev: "150.00",
                iconic: "0.00",
                filtros: "0.00",
                fornecedores: "0.00",
                inadimplencia: "0.00",
                total: 150,
              },
            ],
            totais: { pev: 150, iconic: 0, filtros: 0, fornecedores: 0, inadimplencia: 0, total: 150 },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consultaServiceHttp.listarConsulta("100", { de: "2026-07", ate: "2026-08" });
    expect(resultado.status).toBe("sucesso");
    const cartoes = resultado.status === "sucesso" ? resultado.dados : [];

    expect(cartoes.map((c) => c.mesReferencia)).toEqual(["2026-07", "2026-08"]);

    const agosto = cartoes.find((c) => c.mesReferencia === "2026-08")!;
    expect(agosto.linhas).toHaveLength(1);
    expect(agosto.linhas[0]).toMatchObject({
      vendedorId: "4",
      vendedorNome: "Carlos Eduardo Silva",
      filial: "100",
      pev: 100,
      iconic: 50,
      filtros: 10,
      campanhasFornecedores: 5,
      inadimplencia: -2,
      total: 163,
    });

    const julho = cartoes.find((c) => c.mesReferencia === "2026-07")!;
    expect(julho.linhas).toHaveLength(1);
    expect(julho.linhas[0]).toMatchObject({ vendedorId: "4", pev: 150, total: 150 });

    // uma única chamada, sem passar por /api/usuarios
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).not.toContain("id=");
    expect(chamada).toContain("data_inicio=2026-07-01");
    expect(chamada).toContain("data_fim=2026-08-31");
  });

  it("quando De=Até (mesmo mês), estende data_fim pro dia 1º do mês seguinte — evita o 'roster do mês' da API (Claude/API (16).md) injetar cartão fantasma pra quem nunca lançou nada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ periodo: "", total: 0, meses: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await consultaServiceHttp.listarConsulta("100", { de: "2026-07", ate: "2026-07" });

    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).toContain("data_inicio=2026-07-01");
    expect(chamada).toContain("data_fim=2026-08-01"); // não 2026-07-31 — sai do "mesmo mês"
  });

  it("descarta o mês seguinte que pode vazar por causa do data_fim estendido, mesmo se vier com dado real", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        periodo: "",
        total: 0,
        meses: [
          {
            "mes de referencia": "2026-08-01", // vazou do data_fim=2026-08-01 estendido
            "mes formatado": "Agosto de 2026",
            "quantidade lancamentos": 1,
            subtotal: 50,
            dados: [
              {
                "id colaborador": 9,
                codigo: "V009",
                "nome colaborador": "Alguém de Agosto",
                filial: "100",
                pev: "50.00",
                iconic: "0.00",
                filtros: "0.00",
                fornecedores: "0.00",
                inadimplencia: "0.00",
                total: 50,
              },
            ],
            totais: { pev: 50, iconic: 0, filtros: 0, fornecedores: 0, inadimplencia: 0, total: 50 },
          },
          {
            "mes de referencia": "2026-07-01",
            "mes formatado": "Julho de 2026",
            "quantidade lancamentos": 1,
            subtotal: 30,
            dados: [
              {
                "id colaborador": 4,
                codigo: "V001",
                "nome colaborador": "Carlos Eduardo Silva",
                filial: "100",
                pev: "30.00",
                iconic: "0.00",
                filtros: "0.00",
                fornecedores: "0.00",
                inadimplencia: "0.00",
                total: 30,
              },
            ],
            totais: { pev: 30, iconic: 0, filtros: 0, fornecedores: 0, inadimplencia: 0, total: 30 },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consultaServiceHttp.listarConsulta("100", { de: "2026-07", ate: "2026-07" });
    const cartoes = resultado.status === "sucesso" ? resultado.dados : [];

    // só julho aparece — agosto (fora do "de/até" pedido) some, mesmo tendo vindo na resposta
    expect(cartoes.map((c) => c.mesReferencia)).toEqual(["2026-07"]);
  });

  it("restringe a um único vendedor (?id=) quando `escopo` é informado, sem buscar /api/usuarios", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ periodo: "", total: 0, meses: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await consultaServiceHttp.listarConsulta("100", { de: "2026-08", ate: "2026-08" }, { vendedorId: "4" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).toContain("/api/premiacoes");
    expect(chamada).toContain("id=4");
  });
});

describe("consultaServiceHttp.exportarCSV", () => {
  it("busca o CSV pronto do backend (todo o histórico, sem filtro de período) e dispara o download", async () => {
    const base64 = btoa('"nome colaborador";pev;total\n"Carlos";100.00;100.00');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const resultado = await consultaServiceHttp.exportarCSV("100", { de: "2026-08", ate: "2026-08" });
    expect(resultado.status).toBe("sucesso");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // ignora o filtro de período da tela — exporta o histórico inteiro (sem data_inicio/data_fim)
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).not.toContain("data_inicio");
    expect(chamada).not.toContain("data_fim");
  });

  it("com escopo de vendedor, passa ?id= pra manter a exportação restrita a ele", async () => {
    const base64 = btoa('"nome colaborador";pev;total\n"Carlos";100.00;100.00');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await consultaServiceHttp.exportarCSV("100", { de: "", ate: "" }, { vendedorId: "4" });
    const chamada = fetchMock.mock.calls[0][0] as string;
    expect(chamada).toContain("id=4");
  });

  it("sem lançamento nenhum, devolve erro em vez de baixar um arquivo vazio", async () => {
    const base64 = btoa('"nome colaborador";pev;iconic;filtros;fornecedores;inadimplencia;total');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consultaServiceHttp.exportarCSV("100", { de: "", ate: "" });
    expect(resultado.status).toBe("erro");
  });
});
