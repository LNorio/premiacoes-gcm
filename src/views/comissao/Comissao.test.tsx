import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { premiacaoServiceMock } from "../../adapters/mock/premiacaoService.mock";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { Comissao } from "./Comissao";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <Comissao />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <Comissao />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("Comissao — render e visibilidade (F4.COM-01/02/03/06)", () => {
  it("lista os colaboradores habilitados para a tela de comissão da filial", async () => {
    renderComoGerente(); // gerente é da filial 100 (Carlos, Fernanda; Patricia tem comissao=false)
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.queryByText("Patricia Ferreira")).not.toBeInTheDocument();
  });

  it("não tem coluna Total", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByRole("columnheader", { name: "Total" })).not.toBeInTheDocument();
  });

  it("Gerente não vê a coluna PEV", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByRole("columnheader", { name: "PEV Atingida" })).not.toBeInTheDocument();
  });

  it("Admin vê a coluna PEV, somente leitura, vinda da Planilha de Premiação", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", new Date().toISOString().slice(0, 7), [
      { vendedorId: "seed-v1", pev: 321, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("columnheader", { name: "PEV Atingida" })).toBeInTheDocument();
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(linha.textContent).toContain("321,00");
    expect(screen.queryByLabelText("PEV de Carlos Silva")).not.toBeInTheDocument(); // nunca editável
  });
});

describe("Comissao — edição, rodapé e salvar (F4.COM-04/05)", () => {
  it("edita Comissão e Garantido e atualiza o rodapé sem perder foco", async () => {
    const user = userEvent.setup();
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    // user.type digita caractere a caractere; se o campo perdesse o foco a cada
    // re-render, "500"/"100" não se acumulariam corretamente nos inputs.
    await user.type(screen.getByLabelText("Comissão de Carlos Silva"), "500");
    await user.type(screen.getByLabelText("Garantido de Carlos Silva"), "100");

    expect(screen.getByLabelText("Comissão de Carlos Silva")).toHaveValue(500);
    expect(screen.getByLabelText("Garantido de Carlos Silva")).toHaveValue(100);
    // Comissão e Garantido têm totais separados no rodapé — não existe coluna "Total".
    const rodape = screen.getByText("Total geral").closest("tr")!;
    await waitFor(() => {
      expect(rodape.textContent).toContain("500,00");
      expect(rodape.textContent).toContain("100,00");
    });
  });

  it("salva as comissões e persiste ao recarregar", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("Comissão de Carlos Silva"), "500");
    await user.click(screen.getByRole("button", { name: /Salvar comissões do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("Comissão de Carlos Silva")).toHaveValue(500));
    unmount();

    renderComoAdminNaFilial("100");
    expect(await screen.findByLabelText("Comissão de Carlos Silva")).toHaveValue(500);
  });
});

describe("Comissao — exportação (F4.COM-09)", () => {
  it("mostra o botão de exportar Excel da filial", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Exportar Excel da filial/ })).toBeInTheDocument();
  });
});

describe("Comissao — bloqueio (F4.COM-07)", () => {
  it("Admin numa filial específica vê o botão de bloqueio; em Todas as filiais, não", async () => {
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ })).toBeInTheDocument();
    unmount();

    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <Comissao />
        </ComSessao>
      </SessaoProvider>,
    );
    await waitFor(() => expect(screen.getAllByText("Carlos Silva").length).toBeGreaterThan(0));
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
    expect(await screen.findByLabelText("Comissão de Carlos Silva")).toBeDisabled();
  });
});
