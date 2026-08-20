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

  it("colaborador sem lançamento no mês mostra 'Nenhum lançamento neste mês'", async () => {
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(within(linha).getByText("Nenhum lançamento neste mês")).toBeInTheDocument();
  });
});

describe("Descontos — múltiplos lançamentos por colaborador (F4.DESC-04/05)", () => {
  it("adiciona um lançamento e preenche Tipo/Valor/Observações", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const linhaCarlos = () => screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos()).getByRole("button", { name: "+ Adicionar" }));

    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "150");
    await user.type(screen.getByLabelText("Observações do lançamento 1 de Carlos Silva"), "Meta batida");

    expect(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva")).toHaveValue("Bonificação");
    expect(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva")).toHaveValue(150);
    expect(screen.getByLabelText("Observações do lançamento 1 de Carlos Silva")).toHaveValue("Meta batida");
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

  it("Remover tira o lançamento e volta a mostrar 'Nenhum lançamento neste mês'", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "200");
    await waitFor(() => expect(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva")).toHaveValue(200));

    await user.click(within(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva").closest("tr")!).getByRole("button", { name: "Remover" }));
    await waitFor(() =>
      expect(screen.getByText("Carlos Silva").closest("tr")!.textContent).toContain("Nenhum lançamento neste mês"),
    );
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

describe("Descontos — modal Totais por tipo: todos os tipos somam positivo, já que agora são exibidos separados", () => {
  it("modal mostra só os tipos com lançamento no mês, cada um com a soma simples e positiva do seu valor", async () => {
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

    await user.click(screen.getByRole("button", { name: "📊 Totais por tipo" }));
    const modal = screen.getByRole("dialog");

    const linhaBonificacao = within(modal).getByText("Bonificação").closest("tr")!;
    expect(within(linhaBonificacao).getByText("R$ 300,00")).toBeInTheDocument();
    const linhaMulta = within(modal).getByText("Multa").closest("tr")!;
    expect(within(linhaMulta).getByText("R$ 80,00")).toBeInTheDocument();
    expect(within(linhaMulta).queryByText(/-R\$/)).not.toBeInTheDocument();

    // só os dois tipos lançados aparecem — nenhum outro tipo do catálogo
    expect(within(modal).getAllByRole("row")).toHaveLength(3); // cabeçalho + 2

    expect(screen.getByLabelText("Valor do lançamento 2 de Carlos Silva")).toHaveValue(80);
  });

  it("soma dois lançamentos do mesmo tipo (colaboradores diferentes) no total desse tipo", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Farmácia");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "50");

    await user.click(within(screen.getByText("Fernanda Lima").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Fernanda Lima"), "Farmácia");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Fernanda Lima"), "30");

    await user.click(screen.getByRole("button", { name: "📊 Totais por tipo" }));
    const linhaFarmacia = within(screen.getByRole("dialog")).getByText("Farmácia").closest("tr")!;
    expect(within(linhaFarmacia).getByText("R$ 80,00")).toBeInTheDocument();
  });

  it("sem lançamentos no mês, o modal mostra mensagem de vazio", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "📊 Totais por tipo" }));
    expect(within(screen.getByRole("dialog")).getByText("Nenhum lançamento neste mês.")).toBeInTheDocument();
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

describe("Descontos — barra de busca", () => {
  it("filtra por nome sem diferenciar maiúscula/acento, e mostra mensagem específica sem resultado", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar colaborador"), "CARLOS");
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar colaborador"));
    await user.type(screen.getByLabelText("Buscar colaborador"), "zzz");
    expect(screen.getByText('Nenhum colaborador encontrado para "zzz".')).toBeInTheDocument();
    expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument();
  });

  it("o ícone de ajuda ao lado da busca explica que ela não afeta totalizadores nem exportação", async () => {
    const user = userEvent.setup();
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ajuda" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/não altera o total por tipo nem a exportação/);
  });
});

describe("Descontos — paginação", () => {
  it("mostra a paginação por colaborador e os totais por tipo continuam somando todo mundo, independente da página", async () => {
    const user = userEvent.setup();
    renderComoCoordenador(); // Carlos, Fernanda, Patricia — 3 colaboradores com descontos=true
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("1–3 de 3")).toBeInTheDocument();

    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Adicionar" }));
    await user.selectOptions(screen.getByLabelText("Tipo do lançamento 1 de Carlos Silva"), "Bonificação");
    await user.type(screen.getByLabelText("Valor do lançamento 1 de Carlos Silva"), "150");

    await user.click(screen.getByRole("button", { name: "📊 Totais por tipo" }));
    const linhaBonificacao = within(screen.getByRole("dialog")).getByText("Bonificação").closest("tr")!;
    expect(within(linhaBonificacao).getByText("R$ 150,00")).toBeInTheDocument();
  });
});

describe("Descontos — exportação (F4.DESC-09)", () => {
  it("mostra o botão de exportar CSV da filial", async () => {
    renderComoCoordenador();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Exportar CSV da filial/ })).toBeInTheDocument();
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
