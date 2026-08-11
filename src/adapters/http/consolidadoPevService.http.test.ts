import { afterEach, describe, expect, it, vi } from "vitest";
import { consolidadoPevServiceHttp } from "./consolidadoPevService.http";

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
    telas: [1],
  },
  {
    "id colaborador": 1,
    codigo: null,
    nome: "Administrador",
    cpf: "000.000.000-00",
    funcao: "Administrador",
    email: "admin@comercialmariano.com.br",
    usuario: "admin",
    role: "admin",
    filial: "100",
    "plano saude": false,
    "plano odontologico": false,
    telas: [],
  },
];

const CONSOLIDADO_100 = [
  {
    id: 4,
    cpf: "123.456.789-01",
    nome: "Carlos Eduardo Silva",
    "valor dezembro": 0,
    "valor janeiro": 0,
    "valor fevereiro": 0,
    "valor marco": 0,
    "valor abril": 0,
    "valor maio": 0,
    "valor junho": 0,
    "valor julho": 0,
    "valor agosto": 100,
    "valor setembro": 0,
    "valor outubro": 0,
    "valor novembro": 0,
    "total acumulado": 100,
    "base de calculo": 28,
    "valor adiantamento": 10,
    "premiacao total a receber": 18,
  },
  {
    id: 1,
    cpf: "000.000.000-00",
    nome: "Administrador",
    "valor dezembro": 0,
    "valor janeiro": 0,
    "valor fevereiro": 0,
    "valor marco": 0,
    "valor abril": 0,
    "valor maio": 0,
    "valor junho": 0,
    "valor julho": 0,
    "valor agosto": 0,
    "valor setembro": 0,
    "valor outubro": 0,
    "valor novembro": 0,
    "total acumulado": 0,
    "base de calculo": 0,
    "valor adiantamento": 0,
    "premiacao total a receber": 0,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consolidadoPevServiceHttp.listarConsolidadoPev", () => {
  it("mapeia os meses do ciclo para 'YYYY-MM', filtra por telas.premiacoes e cruza a filial com /api/usuarios", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      return Promise.resolve(jsonResponse(CONSOLIDADO_100));
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consolidadoPevServiceHttp.listarConsolidadoPev("100", 2026, ["2026-07", "2026-08"]);

    expect(resultado.status).toBe("sucesso");
    const linhas = resultado.status === "sucesso" ? resultado.dados : [];
    // Administrador não tem telas.premiacoes — não deve aparecer.
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toEqual({
      vendedorId: "4",
      vendedorNome: "Carlos Eduardo Silva",
      cpf: "123.456.789-01",
      filial: "100",
      porMes: { "2026-07": 0, "2026-08": 100 },
      totalAcumulado: 100,
      baseCalculo: 28,
      adiantamento: 10,
      premiacaoAdicionalReceber: 18,
    });
  });

  it("devolve 0 para meses fora do ciclo pedido (a API só cobre um ciclo Dez→Nov por vez)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      return Promise.resolve(jsonResponse(CONSOLIDADO_100));
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consolidadoPevServiceHttp.listarConsolidadoPev("100", 2026, ["2020-01"]);
    const linhas = resultado.status === "sucesso" ? resultado.dados : [];
    expect(linhas[0].porMes).toEqual({ "2020-01": 0 });
  });
});

describe("consolidadoPevServiceHttp.salvarAdiantamento", () => {
  it("faz PUT /api/consolidado/adiantamento com o corpo esperado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ mensagem: "lista salva com sucesso" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await consolidadoPevServiceHttp.salvarAdiantamento("4", 2026, 10);
    expect(resultado).toEqual({ status: "sucesso", dados: undefined });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/consolidado/adiantamento");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual([{ "id colaborador": 4, "ano referencia": 2026, adiantamento: 10 }]);
  });
});
