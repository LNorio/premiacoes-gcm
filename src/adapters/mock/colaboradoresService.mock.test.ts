import { beforeEach, describe, expect, it } from "vitest";
import { FILIAL_TODAS, type Colaborador } from "../../types";
import { colaboradoresServiceMock } from "./colaboradoresService.mock";

beforeEach(() => {
  localStorage.clear();
});

describe("colaboradoresServiceMock", () => {
  it("lista os 6 colaboradores seed quando filial=FILIAL_TODAS", async () => {
    const resultado = await colaboradoresServiceMock.listarColaboradores(FILIAL_TODAS);
    expect(resultado.status).toBe("sucesso");
    expect(resultado.status === "sucesso" && resultado.dados).toHaveLength(6);
  });

  it("filtra por filial específica", async () => {
    const resultado = await colaboradoresServiceMock.listarColaboradores("401");
    expect(resultado.status === "sucesso" && resultado.dados.every((c) => c.filial === "401")).toBe(true);
  });

  it("salva um colaborador novo (id vazio) gerando um id", async () => {
    const novo: Colaborador = {
      id: "",
      codigo: "010",
      nome: "Novo Colaborador",
      cpf: "999.999.999-99",
      filial: "100",
      cargo: "Vendedor",
      email: "novo@comercialmariano.com.br",
      usuarioAcesso: "novo.colaborador",
      senhaAcesso: "venda123",
      telas: { premiacoes: true, comissao: false, planoSaude: true, estoque: false, descontos: true },
    };
    const salvo = await colaboradoresServiceMock.salvarColaborador(novo);
    expect(salvo.status).toBe("sucesso");
    expect(salvo.status === "sucesso" && salvo.dados.id).not.toBe("");

    const listagem = await colaboradoresServiceMock.listarColaboradores(FILIAL_TODAS);
    expect(listagem.status === "sucesso" && listagem.dados).toHaveLength(7);
  });

  it("remove um colaborador existente", async () => {
    await colaboradoresServiceMock.removerColaborador("seed-v1");
    const listagem = await colaboradoresServiceMock.listarColaboradores(FILIAL_TODAS);
    expect(listagem.status === "sucesso" && listagem.dados.find((c) => c.id === "seed-v1")).toBeUndefined();
    expect(listagem.status === "sucesso" && listagem.dados).toHaveLength(5);
  });
});
