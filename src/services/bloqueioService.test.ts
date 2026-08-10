import { describe, expect, it } from "vitest";
import { chaveBloqueio, usuarioEstaBloqueadoNaTela } from "./bloqueioService";

describe("chaveBloqueio", () => {
  it("monta a chave 'tela::filial::mesReferencia'", () => {
    expect(chaveBloqueio("premiacao", "100", "2026-07")).toBe("premiacao::100::2026-07");
  });
});

describe("usuarioEstaBloqueadoNaTela", () => {
  it("Admin nunca é bloqueado, mesmo com bloqueado=true", () => {
    expect(usuarioEstaBloqueadoNaTela("premiacao", "admin", true)).toBe(false);
  });

  it("bloqueia o papel editor da tela quando bloqueado=true", () => {
    // premiacao é editada pelo 'gerente' (PAPEL_EDITOR_POR_TELA)
    expect(usuarioEstaBloqueadoNaTela("premiacao", "gerente", true)).toBe(true);
  });

  it("não bloqueia o papel editor quando bloqueado=false", () => {
    expect(usuarioEstaBloqueadoNaTela("premiacao", "gerente", false)).toBe(false);
  });

  it("não bloqueia um papel que não é o editor daquela tela", () => {
    // comissao é editada pelo 'gerente', não pelo 'coordenador'
    expect(usuarioEstaBloqueadoNaTela("comissao", "coordenador", true)).toBe(false);
  });
});
