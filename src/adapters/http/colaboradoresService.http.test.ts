import { afterEach, describe, expect, it, vi } from "vitest";
import { colaboradoresServiceHttp } from "./colaboradoresService.http";

function respostaUsuarios(usuarios: unknown[]): Response {
  return new Response(JSON.stringify(usuarios), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("colaboradoresServiceHttp.listarColaboradores", () => {
  it("mapeia a resposta da API para Colaborador, convertendo IDs de tela para o formato interno", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaUsuarios([
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
          telas: [1, 2],
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await colaboradoresServiceHttp.listarColaboradores("100");

    expect(resultado).toEqual({
      status: "sucesso",
      dados: [
        {
          id: "4",
          codigo: "V001",
          nome: "Carlos Eduardo Silva",
          cpf: "123.456.789-01",
          filial: "100",
          cargo: "Consultor de Vendas Interno",
          role: "vendedor",
          email: "carlos.silva@comercialmariano.com.br",
          usuarioAcesso: "carlos.silva",
          senhaAcesso: "",
          telas: { premiacoes: true, comissao: true, planoSaude: false, estoque: false, descontos: false },
          adesaoSaude: true,
          adesaoOdontologico: false,
        },
      ],
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/usuarios?filial=100");
  });

  it("lista colaboradores de qualquer Perfil (Admin/Gerente/Coordenador/Vendedor)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaUsuarios([
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
          telas: [],
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await colaboradoresServiceHttp.listarColaboradores("100");
    expect(resultado.status === "sucesso" && resultado.dados).toHaveLength(2);
    expect(resultado.status === "sucesso" && resultado.dados.map((c) => c.role)).toEqual(["admin", "vendedor"]);
    expect(resultado.status === "sucesso" && resultado.dados[0].codigo).toBe(""); // codigo: null vira ""
  });

  it("não envia filtro de filial quando FILIAL_TODAS", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaUsuarios([]));
    vi.stubGlobal("fetch", fetchMock);

    await colaboradoresServiceHttp.listarColaboradores("TODAS");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain("filial=");
  });

  it("devolve erro com a mensagem da API quando a chamada falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ mensagem: "não autorizado" }), { status: 403 })));

    const resultado = await colaboradoresServiceHttp.listarColaboradores("100");
    expect(resultado).toEqual({ status: "erro", mensagem: "não autorizado" });
  });
});

describe("colaboradoresServiceHttp.salvarColaborador", () => {
  it("faz PUT quando o colaborador já tem id e não reenvia a senha se ela vier em branco", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ mensagem: "usuario atualizado" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await colaboradoresServiceHttp.salvarColaborador({
      id: "4",
      codigo: "V001",
      nome: "Carlos Eduardo Silva",
      cpf: "123.456.789-01",
      filial: "100",
      cargo: "Consultor de Vendas Interno",
      role: "vendedor",
      email: "carlos.silva@comercialmariano.com.br",
      usuarioAcesso: "carlos.silva",
      senhaAcesso: "",
      telas: { premiacoes: true, comissao: false, planoSaude: false, estoque: false, descontos: false },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/usuarios/4");
    expect(init.method).toBe("PUT");
    const corpo = JSON.parse(init.body as string);
    expect(corpo.senha).toBeUndefined();
    expect(corpo.telas).toEqual([1]);
    expect(corpo.role).toBe("vendedor");
  });

  it("faz POST quando o colaborador é novo (sem id) e envia a senha", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ mensagem: "usuario criado" }), { status: 200 }))
      .mockResolvedValueOnce(
        respostaUsuarios([
          {
            "id colaborador": 10,
            codigo: "V010",
            nome: "Novo Colaborador",
            cpf: "111.111.111-11",
            funcao: "Consultor de Vendas Interno",
            email: "",
            usuario: "novo.colaborador",
            role: "vendedor",
            filial: "100",
            "plano saude": true,
            "plano odontologico": true,
            telas: [],
          },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await colaboradoresServiceHttp.salvarColaborador({
      id: "",
      codigo: "V010",
      nome: "Novo Colaborador",
      cpf: "111.111.111-11",
      filial: "100",
      cargo: "Consultor de Vendas Interno",
      role: "vendedor",
      email: "",
      usuarioAcesso: "novo.colaborador",
      senhaAcesso: "venda123",
      telas: { premiacoes: false, comissao: false, planoSaude: false, estoque: false, descontos: false },
    });

    const [urlPost, initPost] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(urlPost).toContain("/api/usuarios");
    expect(initPost.method).toBe("POST");
    expect(JSON.parse(initPost.body as string).senha).toBe("venda123");

    // POST não devolve o id — relista para descobrir o id real criado.
    expect(resultado.status === "sucesso" && resultado.dados.id).toBe("10");
  });
});

describe("colaboradoresServiceHttp.removerColaborador", () => {
  it("faz DELETE /api/usuarios/{id}", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await colaboradoresServiceHttp.removerColaborador("4");
    expect(resultado).toEqual({ status: "sucesso", dados: undefined });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/usuarios/4");
    expect(init.method).toBe("DELETE");
  });
});
