import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { colaboradoresService } from "./adapters";
import { SessaoProvider } from "./state/SessaoContext";
import { ComSessao } from "./testUtils/ComSessao";
import { FILIAL_TODAS } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("sem sessão, renderiza a tela de Login", () => {
    render(
      <SessaoProvider>
        <App />
      </SessaoProvider>,
    );
    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
  });

  it("com sessão normal, renderiza o Shell", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <App />
        </ComSessao>
      </SessaoProvider>,
    );
    expect(await screen.findByText("Painel Geral")).toBeInTheDocument();
  });

  it("com 'precisaTrocarSenha', renderiza a tela de troca de senha em vez do Shell", async () => {
    const resultado = await colaboradoresService.listarColaboradores(FILIAL_TODAS);
    if (resultado.status === "sucesso") {
      const carlos = resultado.dados.find((c) => c.usuarioAcesso === "carlos.silva")!;
      await colaboradoresService.salvarColaborador({ ...carlos, precisaTrocarSenha: true });
    }

    render(
      <SessaoProvider>
        <ComSessao usuario="carlos.silva" senha="venda123">
          <App />
        </ComSessao>
      </SessaoProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Troque sua senha" })).toBeInTheDocument();
    expect(screen.queryByText("Painel Geral")).not.toBeInTheDocument();
  });
});
