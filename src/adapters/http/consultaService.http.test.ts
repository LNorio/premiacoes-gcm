import { afterEach, describe, expect, it, vi } from "vitest";
import { consultaServiceHttp } from "./consultaService.http";

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
    "id colaborador": 5,
    codigo: "V002",
    nome: "Fernanda Souza Lima",
    cpf: "234.567.890-12",
    funcao: "Consultor de Vendas Externo",
    email: "fernanda.lima@comercialmariano.com.br",
    usuario: "fernanda.lima",
    role: "vendedor",
    filial: "100",
    "plano saude": true,
    "plano odontologico": true,
    telas: [1],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consultaServiceHttp.listarConsulta", () => {
  it("agrupa em um cartão por mês, com uma linha por colaborador (?id=), sem casar por nome", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      if (url.includes("id=4")) {
        return Promise.resolve(
          jsonResponse({
            periodo: "2026-07-01 a 2026-08-31",
            total: 313,
            meses: [
              {
                "mes de referencia": "2026-08-01",
                "mes formatado": "Agosto de 2026",
                "quantidade lancamentos": 1,
                subtotal: 163,
                dados: [{ "nome colaborador": "Carlos Eduardo Silva", filial: "100", pev: "100.00", iconic: "50.00", filtros: "10.00", fornecedores: "5.00", inadimplencia: "-2.00", total: 163 }],
                totais: { pev: 100, iconic: 50, filtros: 10, fornecedores: 5, inadimplencia: -2, total: 163 },
              },
              {
                "mes de referencia": "2026-07-01",
                "mes formatado": "Julho de 2026",
                "quantidade lancamentos": 1,
                subtotal: 150,
                dados: [{ "nome colaborador": "Carlos Eduardo Silva", filial: "100", pev: "150.00", iconic: "0.00", filtros: "0.00", fornecedores: "0.00", inadimplencia: "0.00", total: 150 }],
                totais: { pev: 150, iconic: 0, filtros: 0, fornecedores: 0, inadimplencia: 0, total: 150 },
              },
            ],
          }),
        );
      }
      // Fernanda (id 5) sem lançamentos no período
      return Promise.resolve(jsonResponse({ periodo: "2026-07-01 a 2026-08-31", total: 0, meses: [] }));
    });
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

    // confirma que o intervalo do filtro foi propagado corretamente para a query
    const chamadaCarlos = fetchMock.mock.calls.map((c) => c[0] as string).find((u) => u.includes("id=4"))!;
    expect(chamadaCarlos).toContain("data_inicio=2026-07-01");
    expect(chamadaCarlos).toContain("data_fim=2026-08-31");
  });

  it("restringe a um único vendedor quando `escopo` é informado", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      return Promise.resolve(jsonResponse({ periodo: "", total: 0, meses: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await consultaServiceHttp.listarConsulta("100", { de: "2026-08", ate: "2026-08" }, { vendedorId: "4" });

    const chamadasPremiacoes = fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => u.includes("/api/premiacoes"));
    expect(chamadasPremiacoes).toHaveLength(1);
    expect(chamadasPremiacoes[0]).toContain("id=4");
  });
});
