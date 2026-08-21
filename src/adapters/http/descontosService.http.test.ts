import { afterEach, describe, expect, it, vi } from "vitest";
import { descontosServiceHttp } from "./descontosService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("descontosServiceHttp.listarDescontos", () => {
  it("achata 'descontos e bonificacoes' por colaborador num array plano, com id composto, e traz o roster completo (Claude/API (18).md — codigo)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        total: 80,
        dados: [
          {
            "id colaborador": 4,
            codigo: "V001",
            "nome colaborador": "Carlos Eduardo Silva",
            "descontos e bonificacoes": [
              { id: 2, tipo: "Multa", valor: "50.00", observacao: "atraso" },
              { id: 4, tipo: "Farmácia", valor: "30.00", observacao: "" },
            ],
            total: 80,
          },
          {
            "id colaborador": 5,
            codigo: "V005",
            "nome colaborador": "Fernanda Souza Lima",
            "descontos e bonificacoes": [],
            total: 0,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await descontosServiceHttp.listarDescontos("100", "2026-08");
    expect(resultado).toEqual({
      status: "sucesso",
      dados: {
        // roster inteiro — inclusive Fernanda, que ainda não tem lançamento nenhum.
        colaboradores: [
          { id: "4", codigo: "V001", nome: "Carlos Eduardo Silva" },
          { id: "5", codigo: "V005", nome: "Fernanda Souza Lima" },
        ],
        lancamentos: [
          { id: "4:2", vendedorId: "4", mesReferencia: "2026-08", tipo: "Multa", valor: 50, observacoes: "atraso" },
          { id: "4:4", vendedorId: "4", mesReferencia: "2026-08", tipo: "Farmácia", valor: 30, observacoes: "" },
        ],
      },
    });

    // uma única chamada, sem passar por /api/usuarios
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("mes_de_referencia=2026-08-01");
    expect(url).toContain("filial=100");
  });
});

describe("descontosServiceHttp.salvarDescontos", () => {
  it("apaga lançamentos existentes (tem id) e recria tudo via PUT, depois relista", async () => {
    const chamadasDelete: unknown[] = [];
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        chamadasDelete.push(JSON.parse(init.body as string));
        return Promise.resolve(jsonResponse({ mensagem: "desconto/ bonificacao excluida com sucesso" }));
      }
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "dados salvos com sucesso" }));
      // relistagem final
      return Promise.resolve(
        jsonResponse({
          total: 80,
          dados: [
            {
              "id colaborador": 4,
              "nome colaborador": "Carlos Eduardo Silva",
              "descontos e bonificacoes": [
                { id: 10, tipo: "Multa", valor: "50.00", observacao: "atraso" },
                { id: 11, tipo: "Bonificação", valor: "20.00", observacao: "" },
              ],
              total: 70,
            },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await descontosServiceHttp.salvarDescontos([
      { id: "4:2", vendedorId: "4", mesReferencia: "2026-08", tipo: "Multa", valor: 50, observacoes: "atraso" },
      { vendedorId: "4", mesReferencia: "2026-08", tipo: "Bonificação", valor: 20, observacoes: "" },
    ]);

    expect(chamadasDelete).toEqual([{ id_do_desconto: 2, id_do_colaborador: 4 }]);

    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT")!;
    const corpoPut = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(corpoPut).toEqual([
      {
        "id colaborador": 4,
        "mes de referencia": "2026-08-01",
        dados: [
          { tipo: "Multa", valor: 50, observacoes: "atraso" },
          { tipo: "Bonificação", valor: 20, observacoes: "" },
        ],
      },
    ]);

    expect(resultado).toEqual({
      status: "sucesso",
      dados: [
        { id: "4:10", vendedorId: "4", mesReferencia: "2026-08", tipo: "Multa", valor: 50, observacoes: "atraso" },
        { id: "4:11", vendedorId: "4", mesReferencia: "2026-08", tipo: "Bonificação", valor: 20, observacoes: "" },
      ],
    });
  });

  it("não faz DELETE nem PUT quando não há lançamentos (nada a salvar)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await descontosServiceHttp.salvarDescontos([]);
    expect(resultado).toEqual({ status: "sucesso", dados: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("descontosServiceHttp.removerDesconto", () => {
  it("separa o id composto e chama DELETE com id_do_desconto/id_do_colaborador", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ mensagem: "desconto/ bonificacao excluida com sucesso" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await descontosServiceHttp.removerDesconto("4:2");
    expect(resultado).toEqual({ status: "sucesso", dados: undefined });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/descontos-bonificacoes");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ id_do_desconto: 2, id_do_colaborador: 4 });
  });
});

describe("descontosServiceHttp.exportarCSV", () => {
  it("busca o CSV pronto do backend (GET /api/descontos-bonificacoes/exportar-csv) e dispara o download", async () => {
    const base64 = btoa('"nome colaborador";tipo;valor;observacao\n"Carlos";Multa;50.00;atraso');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const resultado = await descontosServiceHttp.exportarCSV("100", "2026-08");
    expect(resultado.status).toBe("sucesso");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/descontos-bonificacoes/exportar-csv");
    expect(url).toContain("mes_de_referencia=2026-08-01");
    expect(url).toContain("filial=100");
  });

  it("sem lançamento nenhum, devolve erro em vez de baixar um arquivo vazio", async () => {
    const base64 = btoa('"nome colaborador";tipo;valor;observacao');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ "arquivo csv": base64, mensagem: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await descontosServiceHttp.exportarCSV("100", "2026-08");
    expect(resultado.status).toBe("erro");
  });
});
