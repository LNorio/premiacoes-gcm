import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { Login } from "./Login";

beforeEach(() => {
  localStorage.clear();
});

function renderLogin() {
  return render(
    <SessaoProvider>
      <Login />
    </SessaoProvider>,
  );
}

describe("Login", () => {
  it("renderiza os campos de usuário e senha", () => {
    renderLogin();
    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha", { exact: true })).toBeInTheDocument();
  });

  it("a senha começa oculta e alterna ao clicar no botão", async () => {
    const user = userEvent.setup();
    renderLogin();
    const campoSenha = screen.getByLabelText("Senha", { exact: true });
    expect(campoSenha).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(campoSenha).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument();
  });

  it("mostra mensagem de erro para credenciais inválidas", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuário"), "admin");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Usuário ou senha inválidos.");
  });
});
