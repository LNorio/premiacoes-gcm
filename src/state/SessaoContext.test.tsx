import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider, useSessao } from "./SessaoContext";

function Sonda() {
  const { sessao, entrando, erro, entrar, sair, definirFilialAtiva } = useSessao();
  return (
    <div>
      <span data-testid="role">{sessao?.role ?? "null"}</span>
      <span data-testid="filial">{sessao?.filialAtiva ?? "null"}</span>
      <span data-testid="entrando">{String(entrando)}</span>
      <span data-testid="erro">{erro ?? "null"}</span>
      <button onClick={() => entrar("admin", "admin123")}>login-admin</button>
      <button onClick={() => entrar("admin", "senha-errada")}>login-invalido</button>
      <button onClick={sair}>sair</button>
      <button onClick={() => definirFilialAtiva("401")}>trocar-filial</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("SessaoProvider", () => {
  it("começa sem sessão", () => {
    render(
      <SessaoProvider>
        <Sonda />
      </SessaoProvider>,
    );
    expect(screen.getByTestId("role")).toHaveTextContent("null");
  });

  it("entrar com credenciais válidas monta a sessão", async () => {
    render(
      <SessaoProvider>
        <Sonda />
      </SessaoProvider>,
    );
    await act(async () => {
      screen.getByText("login-admin").click();
    });
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));
    expect(screen.getByTestId("filial")).toHaveTextContent("TODAS");
  });

  it("entrar com credenciais inválidas seta erro e não monta sessão", async () => {
    render(
      <SessaoProvider>
        <Sonda />
      </SessaoProvider>,
    );
    await act(async () => {
      screen.getByText("login-invalido").click();
    });
    await waitFor(() => expect(screen.getByTestId("erro")).not.toHaveTextContent("null"));
    expect(screen.getByTestId("role")).toHaveTextContent("null");
  });

  it("sair limpa a sessão", async () => {
    render(
      <SessaoProvider>
        <Sonda />
      </SessaoProvider>,
    );
    await act(async () => {
      screen.getByText("login-admin").click();
    });
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));

    await act(async () => {
      screen.getByText("sair").click();
    });
    expect(screen.getByTestId("role")).toHaveTextContent("null");
  });

  it("definirFilialAtiva atualiza a filial da sessão", async () => {
    render(
      <SessaoProvider>
        <Sonda />
      </SessaoProvider>,
    );
    await act(async () => {
      screen.getByText("login-admin").click();
    });
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));

    await act(async () => {
      screen.getByText("trocar-filial").click();
    });
    expect(screen.getByTestId("filial")).toHaveTextContent("401");
  });
});
