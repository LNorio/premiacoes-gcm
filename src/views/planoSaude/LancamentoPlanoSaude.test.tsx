import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { LancamentoPlanoSaude } from "./LancamentoPlanoSaude";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <LancamentoPlanoSaude />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <LancamentoPlanoSaude />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("LancamentoPlanoSaude — Plano de Saúde (F5.PS-LAN)", () => {
  it("mostra o valor fixo padrão (R$ 185,27) na coluna Titular para a filial 100", async () => {
    renderComoAdminNaFilial("100");
    const linha = (await screen.findByText("Carlos Silva")).closest("tr")!;
    expect(within(linha).getByText("TITULAR")).toBeInTheDocument();
    // aparece na coluna Titular e no Total (sem extras lançados, o total é o próprio valor fixo)
    expect(within(linha).getAllByText("R$ 185,27")).toHaveLength(2);
  });

  it("usa o valor diferenciado (R$ 255,54) para as filiais 401/403", async () => {
    renderComoAdminNaFilial("401");
    const linha = (await screen.findByText("Roberto Santos")).closest("tr")!;
    expect(within(linha).getAllByText("R$ 255,54")).toHaveLength(2);
  });

  it("na sub-aba Odontológico usa o valor fixo de R$ 13,56 e não mostra campos editáveis nem o botão de salvar", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    await user.click(screen.getByRole("button", { name: "Plano Odontológico" }));

    const linha = (await screen.findByText("Carlos Silva")).closest("tr")!;
    // aparece na coluna Titular e no Total (sem campos extras editáveis, o total é o próprio valor fixo)
    expect(within(linha).getAllByText("R$ 13,56")).toHaveLength(2);
    expect(screen.queryByLabelText(/Valor adicional/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Salvar lançamento do mês/ })).not.toBeInTheDocument();
  });

  it("edita valor adicional/coparticipação, salva e o total da linha reflete a soma", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    await user.type(screen.getByLabelText("Valor adicional de Carlos Silva"), "20");
    await user.type(screen.getByLabelText("Valor de coparticipação de Carlos Silva"), "5");

    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    await waitFor(() => expect(within(linha).getByText("R$ 210,27")).toBeInTheDocument()); // 185.27 + 20 + 5

    await user.click(screen.getByRole("button", { name: /Salvar lançamento do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("Valor adicional de Carlos Silva")).toHaveValue(20));
  });

  it("Gerente não acessa (fora do NAV_POR_PAPEL, guarda de rota é responsabilidade do Shell) — aqui só garantimos que a tela não quebra se montada", async () => {
    renderComoGerente();
    await screen.findByText("Lançamento mensal do desconto");
  });

  it("Admin numa filial específica vê o botão de bloqueio na sub-aba Saúde", async () => {
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    expect(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ })).toBeInTheDocument();
  });

  it("Admin em 'Todas as filiais' vê a coluna Filial e não vê o botão de bloqueio", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <LancamentoPlanoSaude />
        </ComSessao>
      </SessaoProvider>,
    );
    await screen.findByText("Carlos Silva");
    expect(screen.getByRole("columnheader", { name: "Filial" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bloquear lançamentos deste mês/ })).not.toBeInTheDocument();
  });
});
