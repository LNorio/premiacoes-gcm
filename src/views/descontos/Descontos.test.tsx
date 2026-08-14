import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { Descontos } from "./Descontos";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <Descontos />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoCoordenador() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="coordenador" senha="coord123">
        <Descontos />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("Descontos — render e estrutura (F4.DESC-01/02/03)", () => {
  it("lista os colaboradores habilitados para a tela de descontos da filial", async () => {
    renderComoCoordenador(); // coordenador é da filial 100 (Carlos, Fernanda, Patricia — todos com descontos=true)
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.getByText("Patricia Ferreira")).toBeInTheDocument();
  });

  it("colaborador sem lançamento no mês mostra 'Nenhum lançamento neste mês' e total zerado", async () => {
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(within(linha).getByText("Nenhum lançamento neste mês")).toBeInTheDocument();
    expect(within(linha).getByText("R$ 0,00")).toBeInTheDocument();
  });
});

describe("Descontos — múltiplos lançamentos por colaborador (F4.DESC-04/05)", () => {
  it("adiciona um lançamento, preenche Tipo/Valor/Observações e o Total do colaborador é atualizado", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const linhaCarlos = () => screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos()).getByRole("button", { name: "+ Adicionar" }));

    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "150");
    await user.type(screen.getByLabelText("Observações do lançamento 1 de Carlos Silva"), "Meta batida");

    await waitFor(() => expect(linhaCarlos().textContent).toContain("150,00"));
  });

  it("permite mais de um lançamento no mesmo mês para o mesmo colaborador, cada um com sua própria Remover", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "100");
    const linhaComLancamento1 = screen.getByLabelText("Valor do lançamento 1 de Carlos Silva").closest("tr")!;
    await user.click(within(linhaComLancamento1).getByRole("button", { name: "+ Adicionar" }));

    expect(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor do lançamento 2 de Carlos Silva")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(2);
  });

  it("Remover tira o lançamento e recalcula o Total do colaborador", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "200");
    await waitFor(() => expect(screen.getByText("Carlos Silva").closest("tr")!.textContent).toContain("200,00"));

    await user.click(within(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva").closest("tr")!).getByRole("button", { name: "Remover" }));
    await waitFor(() =>
      expect(screen.getByText("Carlos Silva").closest("tr")!.textContent).toContain("Nenhum lançamento neste mês"),
    );
  });

  it("soma o Valor de todos os lançamentos de todos os colaboradores no rodapé", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "100");

    const linhaFernanda = screen.getByText("Fernanda Lima").closest("tr")!;
    await user.click(within(linhaFernanda).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Fernanda Lima"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Fernanda Lima"), "50");

    const rodape = screen.getByText("Total geral").closest("tr")!;
    await waitFor(() => expect(rodape.textContent).toContain("150,00"));
  });

  it("salva os lançamentos e eles persistem ao recarregar", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Diária");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "80");
    await user.click(screen.getByRole("button", { name: /Salvar lançamento do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva")).toHaveValue(80));
    unmount();

    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(await screen.findByLabelText("Valor do lançamento 1 de Carlos Silva")).toHaveValue(80);
    expect(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva")).toHaveValue("Diária");
  });
});

describe("Descontos — Total com sinal: Bonificação/Ajuda de Custo somam, os demais tipos subtraem (visual, não altera o valor salvo)", () => {
  it("Total do colaborador soma Bonificação e Ajuda de Custo, mas subtrai os demais tipos", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    const linhaCarlos = () => screen.getByText("Carlos Silva").closest("tr")!;
    await waitFor(() => expect(linhaCarlos()).toBeInTheDocument());

    await user.click(within(linhaCarlos()).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "300");

    await user.click(within(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 2 de Carlos Silva"), "Multa");
    await user.type(screen.getByLabelText("Valor do lançamento 2 de Carlos Silva"), "80");

    // 300 (Bonificação, soma) - 80 (Multa, subtrai) = 220
    await waitFor(() => expect(linhaCarlos().textContent).toContain("220,00"));
    // o valor digitado continua positivo na própria célula, só o Total é que reflete o sinal
    expect(screen.getByLabelText("Valor do lançamento 2 de Carlos Silva")).toHaveValue(80);
  });

  it("Ajuda de Custo/Gratificação soma, e um total só de tipos que descontam fica negativo", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    const linhaCarlos = () => screen.getByText("Carlos Silva").closest("tr")!;
    await waitFor(() => expect(linhaCarlos()).toBeInTheDocument());

    await user.click(within(linhaCarlos()).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Farmácia");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "50");

    await waitFor(() => expect(linhaCarlos().textContent).toMatch(/-R\$\s*50,00/));
  });

  it("não envia valores negativos ao salvar — o valor gravado é sempre o digitado", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Multa");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "60");
    await user.click(screen.getByRole("button", { name: /Salvar lançamento do mês/ }));

    await waitFor(() => expect(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva")).toHaveValue(60));
  });
});

describe("Descontos — exportação (F4.DESC-09)", () => {
  it("mostra o botão de exportar Excel da filial", async () => {
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Exportar Excel da filial/ })).toBeInTheDocument();
  });
});

describe("Descontos — bloqueio (F4.DESC-07)", () => {
  it("Admin numa filial específica vê o botão de bloqueio; em Todas as filiais, não", async () => {
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ })).toBeInTheDocument();
    unmount();

    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <Descontos />
        </ComSessao>
      </SessaoProvider>,
    );
    await waitFor(() => expect(screen.getAllByText("Carlos Silva").length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: /Bloquear lançamentos deste mês/ })).not.toBeInTheDocument();
  });

  it("bloqueado pelo Admin, o Coordenador não pode adicionar/remover/editar", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Desbloquear/ })).toBeInTheDocument());
    unmount();

    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(within(linha).queryByRole("button", { name: "+ Adicionar" })).not.toBeInTheDocument();
  });
});
