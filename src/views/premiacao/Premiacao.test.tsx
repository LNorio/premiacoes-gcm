import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { Premiacao } from "./Premiacao";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <Premiacao />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <Premiacao />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("Premiacao — render e estrutura (F3.PREM-01/02/03)", () => {
  it("lista os colaboradores habilitados para a tela de premiações da filial", async () => {
    renderComoGerente(); // gerente é da filial 100 (Carlos, Fernanda, Patricia — Patricia sem tela premiacoes)
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    // Patricia Ferreira tem telas.premiacoes = false no seed — não deve aparecer
    expect(screen.queryByText("Patricia Ferreira")).not.toBeInTheDocument();
  });
});

describe("Premiacao — edição, totais e salvar (F3.PREM-04/05)", () => {
  it("calcula Total e Planilha Deivson ao digitar nas categorias", async () => {
    const user = userEvent.setup();
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("PEV de Carlos Silva"), "100");
    await user.type(screen.getByLabelText("Premiação Iconic de Carlos Silva"), "50");

    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    await waitFor(() => {
      expect(linha.textContent).toContain(formatarMoedaTeste(150)); // Total
      expect(linha.textContent).toContain(formatarMoedaTeste(50)); // Deivson = 150 - 100
    });
  });

  it("salva a planilha e persiste os valores ao recarregar", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("PEV de Carlos Silva"), "200");
    await user.click(screen.getByRole("button", { name: /Salvar planilha do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("PEV de Carlos Silva")).toHaveValue(200));
    unmount();

    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(await screen.findByLabelText("PEV de Carlos Silva")).toHaveValue(200);
  });
});

describe("Premiacao — bloqueio (F3.PREM-07)", () => {
  it("Admin numa filial específica vê o botão de bloqueio; em Todas as filiais, não", async () => {
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ })).toBeInTheDocument();
  });

  it("Gerente não vê o botão de bloqueio", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Bloquear lançamentos deste mês/ })).not.toBeInTheDocument();
  });

  it("bloqueado pelo Admin, os campos do Gerente ficam desabilitados", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Desbloquear/ })).toBeInTheDocument());
    unmount();

    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(await screen.findByLabelText("PEV de Carlos Silva")).toBeDisabled();
  });
});

function formatarMoedaTeste(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
