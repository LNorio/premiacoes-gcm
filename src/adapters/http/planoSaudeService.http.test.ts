import { afterEach, describe, expect, it, vi } from "vitest";
import { planoSaudeServiceHttp } from "./planoSaudeService.http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("planoSaudeServiceHttp.listarDependentes", () => {
  it("mapeia o array de dependentes (id colaborador → vendedorId)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ id: 5, nome: "Maria Silva", cpf: "111.111.111-11", "id colaborador": 4 }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.listarDependentes("4");
    expect(resultado).toEqual({
      status: "sucesso",
      dados: [{ id: "5", vendedorId: "4", nome: "Maria Silva", cpf: "111.111.111-11" }],
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/dependentes?id%20colaborador=4");
  });
});

describe("planoSaudeServiceHttp.salvarDependente", () => {
  it("cria (POST) e relista pra obter o id real", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ mensagem: "dependente criado" }))
      .mockResolvedValueOnce(jsonResponse([{ id: 9, nome: "João Silva", cpf: "", "id colaborador": 4 }]));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.salvarDependente({ vendedorId: "4", nome: "João Silva", cpf: "" });
    expect(resultado).toEqual({ status: "sucesso", dados: { id: "9", vendedorId: "4", nome: "João Silva", cpf: "" } });

    const postCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(postCall[1].method).toBe("POST");
    expect(JSON.parse(postCall[1].body as string)).toEqual({ nome: "João Silva", "id colaborador": 4 });
  });
});

describe("planoSaudeServiceHttp.removerDependente", () => {
  it("chama DELETE /api/dependentes/{id}", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ mensagem: "removido" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.removerDependente("9");
    expect(resultado).toEqual({ status: "sucesso", dados: undefined });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/dependentes/9");
    expect(init.method).toBe("DELETE");
  });
});

describe("planoSaudeServiceHttp.salvarAdesao", () => {
  it("envia só o campo do tipo de plano em PUT /api/usuarios/{id}", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ mensagem: "usuario alterado" }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.salvarAdesao("4", "odontologico", false);
    expect(resultado).toEqual({ status: "sucesso", dados: undefined });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/usuarios/4");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ "plano odontologico": false });
  });
});

describe("planoSaudeServiceHttp.listarLancamentosPlanoSaude", () => {
  it("mapeia 'dados' do GET /api/lancamentos, distinguindo titular/dependente pelo id dependente", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        dados: [
          { "id colaborador": 4, "id dependente": null, "valor adicional": 20, "valor coparticipacao": 5 },
          { "id colaborador": 4, "id dependente": 9, "valor adicional": 0, "valor coparticipacao": 0 },
        ],
        "total geral": 0,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.listarLancamentosPlanoSaude("100", "2026-08", "saude");
    expect(resultado).toEqual({
      status: "sucesso",
      dados: [
        {
          id: "4-titular-saude-2026-08",
          pessoaId: "4",
          titularId: "4",
          mesReferencia: "2026-08",
          tipoPlano: "saude",
          valorAdicional: 20,
          valorCoparticipacao: 5,
        },
        {
          id: "4-9-saude-2026-08",
          pessoaId: "9",
          titularId: "4",
          mesReferencia: "2026-08",
          tipoPlano: "saude",
          valorAdicional: 0,
          valorCoparticipacao: 0,
        },
      ],
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("mes_de_referencia=2026-08-01");
    expect(url).toContain("tipo_plano=saude");
    expect(url).toContain("filial=100");
  });
});

describe("planoSaudeServiceHttp.salvarLancamentoPlanoSaude", () => {
  it("envia PUT com 'id dependente' só quando a pessoa é dependente, depois relista", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "salvo" }));
      return Promise.resolve(
        jsonResponse({ dados: [{ "id colaborador": 4, "id dependente": 9, "valor adicional": 20, "valor coparticipacao": 0 }] }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.salvarLancamentoPlanoSaude({
      id: "",
      pessoaId: "9",
      titularId: "4",
      mesReferencia: "2026-08",
      tipoPlano: "saude",
      valorAdicional: 20,
      valorCoparticipacao: 0,
    });

    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT")!;
    const corpo = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(corpo).toEqual([
      {
        "id colaborador": 4,
        "id dependente": 9,
        "tipo plano": "saude",
        "mes de referencia": "2026-08-01",
        "valor adicional": 20,
        "valor coparticipacao": 0,
      },
    ]);
    expect(resultado.status).toBe("sucesso");
    if (resultado.status === "sucesso") {
      expect(resultado.dados.pessoaId).toBe("9");
      expect(resultado.dados.valorAdicional).toBe(20);
    }
  });
});

describe("planoSaudeServiceHttp.listarPeriodosPlanoSaude", () => {
  it("mapeia o array de valores-plano-saude", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          filial: "100",
          "tipo plano": "saude",
          "tipo pessoa": "titular",
          valor: 185.27,
          ativo: true,
          "data validade": null,
          "data criacao": "2000-01-01 00:00:00",
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.listarPeriodosPlanoSaude("100", "saude");
    expect(resultado).toEqual({
      status: "sucesso",
      dados: [
        {
          id: "1",
          filial: "100",
          tipoPlano: "saude",
          tipoPessoa: "titular",
          valor: 185.27,
          ativo: true,
          dataCriacao: "2000-01-01 00:00:00",
          dataValidade: null,
        },
      ],
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("tipo_plano=saude");
    expect(url).toContain("filial=100");
  });
});

describe("planoSaudeServiceHttp.salvarPeriodoPlanoSaude", () => {
  it("cria (POST) e relista pra achar o período vigente do tipo de pessoa certo", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Promise.resolve(jsonResponse({ mensagem: "criado" }));
      return Promise.resolve(
        jsonResponse([
          {
            id: 3,
            filial: "100",
            "tipo plano": "saude",
            "tipo pessoa": "titular",
            valor: 185.27,
            ativo: true,
            "data validade": null,
            "data criacao": "2000-01-01 00:00:00",
          },
          {
            id: 2,
            filial: "100",
            "tipo plano": "saude",
            "tipo pessoa": "dependente",
            valor: 200,
            ativo: true,
            "data validade": null,
            "data criacao": "2026-08-14 10:00:00",
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.salvarPeriodoPlanoSaude("100", "saude", "dependente", 200);
    expect(resultado).toEqual({
      status: "sucesso",
      dados: {
        id: "2",
        filial: "100",
        tipoPlano: "saude",
        tipoPessoa: "dependente",
        valor: 200,
        ativo: true,
        dataCriacao: "2026-08-14 10:00:00",
        dataValidade: null,
      },
    });

    const postCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "POST")!;
    expect(JSON.parse((postCall[1] as RequestInit).body as string)).toEqual({
      filial: "100",
      "tipo plano": "saude",
      "tipo pessoa": "dependente",
      valor: 200,
    });
  });

  it("propaga o erro (400: já existe vigente) sem relistar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ mensagem: "já existe um período vigente" }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.salvarPeriodoPlanoSaude("100", "saude", "titular", 200);
    expect(resultado.status).toBe("erro");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("planoSaudeServiceHttp.encerrarPeriodoPlanoSaude", () => {
  it("chama PUT .../encerrar e relista pra obter o registro atualizado", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({ mensagem: "encerrado" }));
      return Promise.resolve(
        jsonResponse([
          {
            id: 1,
            filial: "100",
            "tipo plano": "saude",
            "tipo pessoa": "titular",
            valor: 185.27,
            ativo: false,
            "data validade": "2026-08-14",
            "data criacao": "2000-01-01 00:00:00",
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await planoSaudeServiceHttp.encerrarPeriodoPlanoSaude({
      id: "1",
      filial: "100",
      tipoPlano: "saude",
      tipoPessoa: "titular",
      valor: 185.27,
      ativo: true,
      dataCriacao: "2000-01-01 00:00:00",
      dataValidade: null,
    });

    expect(resultado).toEqual({
      status: "sucesso",
      dados: {
        id: "1",
        filial: "100",
        tipoPlano: "saude",
        tipoPessoa: "titular",
        valor: 185.27,
        ativo: false,
        dataCriacao: "2000-01-01 00:00:00",
        dataValidade: "2026-08-14",
      },
    });
    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT")!;
    expect(putCall[0]).toContain("/api/valores-plano-saude/1/encerrar");
  });
});
