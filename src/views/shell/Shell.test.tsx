import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComSessao } from "../../testUtils/ComSessao";
import { Shell } from "./Shell";

beforeEach(() => {
  localStorage.clear();
});

function renderShellComo(usuario: string, senha: string) {
  return render(
    <SessaoProvider>
      <ComSessao usuario={usuario} senha={senha}>
        <Shell />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("Shell", () => {
  it("Admin vê todas as 8 abas de NAV_POR_PAPEL (Premiações Estoque fica de fora — F6 não implementado)", async () => {
    renderShellComo("admin", "admin123");
    await waitFor(() => expect(screen.getByText("Painel Geral")).toBeInTheDocument());
    const nav = within(screen.getByRole("navigation"));

    for (const rotulo of [
      "Início",
      "Colaboradores",
      "Consulta",
      "Consolidado PEV",
      "Premiação",
      "Comissão",
      "Descontos/Bonificações",
      "Plano de Saúde",
    ]) {
      expect(nav.getByRole("button", { name: rotulo })).toBeInTheDocument();
    }
    expect(nav.queryByRole("button", { name: "Premiações Estoque" })).not.toBeInTheDocument();
  });

  it("Vendedor vê só Início e Consulta (guarda de rota por NAV_POR_PAPEL)", async () => {
    renderShellComo("carlos.silva", "venda123");
    await waitFor(() => expect(screen.getByText("Painel Geral")).toBeInTheDocument());
    const nav = within(screen.getByRole("navigation"));

    expect(nav.getByRole("button", { name: "Início" })).toBeInTheDocument();
    expect(nav.getByRole("button", { name: "Consulta" })).toBeInTheDocument();
    expect(nav.queryByRole("button", { name: "Colaboradores" })).not.toBeInTheDocument();
  });

  it("clicar numa aba de navegação troca a view exibida", async () => {
    const user = userEvent.setup();
    renderShellComo("admin", "admin123");
    await waitFor(() => expect(screen.getByText("Painel Geral")).toBeInTheDocument());

    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: "Colaboradores" }));
    expect(await screen.findByText("Cadastro de Colaboradores")).toBeInTheDocument();
  });

  it("perfis não-admin não veem o seletor de filial, só o badge fixo", async () => {
    renderShellComo("coordenador", "coord123");
    await waitFor(() => expect(screen.getByText("Painel Geral")).toBeInTheDocument());

    expect(screen.queryByLabelText("Filial")).not.toBeInTheDocument();
    expect(within(screen.getByRole("banner")).getByText("Filial 100")).toBeInTheDocument();
  });

  it("aba Plano de Saúde já renderiza a tela real, não o placeholder EmConstrucao", async () => {
    const user = userEvent.setup();
    renderShellComo("admin", "admin123");
    await waitFor(() => expect(screen.getByText("Painel Geral")).toBeInTheDocument());

    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: "Plano de Saúde" }));
    expect(await screen.findByText("Desconto Plano de Saúde")).toBeInTheDocument();
    expect(screen.queryByText("Esta tela ainda não foi implementada.")).not.toBeInTheDocument();
  });
});
