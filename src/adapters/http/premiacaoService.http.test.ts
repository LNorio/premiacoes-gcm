import { afterEach, describe, expect, it, vi } from "vitest";
import { premiacaoServiceHttp } from "./premiacaoService.http";

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
    telas: [],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

const USUARIOS_100_AMBOS_HABILITADOS = USUARIOS_100.map((u) => ({ ...u, telas: [1] }));

describe("premiacaoServiceHttp.listarPremiacoes", () => {
  it("faz uma requisição GET por colaborador (?id=), não casando por nome, e zera quem não tem lançamento", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100_AMBOS_HABILITADOS));
      if (url.includes("id=4")) {
        return Promise.resolve(
          jsonResponse({
            periodo: "2026-08-01 a 2026-08-31",
            total: 163,
            meses: [
              {
                "mes de referencia": "2026-08-01",
                "mes formatado": "Agosto de 2026",
                "quantidade lancamentos": 1,
                subtotal: 163,
                dados: [{ "nome colaborador": "Carlos Eduardo Silva", filial: "100", pev: "100.00", iconic: "50.00", filtros: "10.00", fornecedores: "5.00", inadimplencia: "-2.00", total: 163 }],
                totais: { pev: 100, iconic: 50, filtros: 10, fornecedores: 5, inadimplencia: -2, total: 163 },
              },
            ],
          }),
        );
      }
      // Fernanda (id 5) sem lançamento no mês
      return Promise.resolve(jsonResponse({ periodo: "2026-08-01 a 2026-08-31", total: 0, meses: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await premiacaoServiceHttp.listarPremiacoes("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    expect(dados).toHaveLength(2);

    const carlos = dados.find((p) => p.vendedorId === "4")!;
    expect(carlos).toMatchObject({
      vendedorId: "4",
      vendedorNome: "Carlos Eduardo Silva",
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
    expect(fernanda).toMatchObject({ pev: 0, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0, total: 0 });

    // confirma que a query usou o intervalo do mês inteiro e o id certo por colaborador
    const chamadaCarlos = fetchMock.mock.calls.map((c) => c[0] as string).find((u) => u.includes("id=4"))!;
    expect(chamadaCarlos).toContain("data_inicio=2026-08-01");
    expect(chamadaCarlos).toContain("data_fim=2026-08-31");
  });

  it("lista só colaboradores habilitados para a tela (telas.premiacoes)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
      return Promise.resolve(jsonResponse({ periodo: "", total: 0, meses: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await premiacaoServiceHttp.listarPremiacoes("100", "2026-08");
    const dados = resultado.status === "sucesso" ? resultado.dados : [];
    // Só Carlos tem telas.premiacoes = true (id de tela 1) no fixture.
    expect(dados.map((p) => p.vendedorId)).toEqual(["4"]);
  });
});

describe("premiacaoServiceHttp.salvarPremiacoes", () => {
  it("faz PUT /api/premiacoes com o corpo esperado e depois relista", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "dados cadastrados com sucesso" }));
      if (url.includes("/api/usuarios")) return Promise.resolve(jsonResponse(USUARIOS_100));
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
