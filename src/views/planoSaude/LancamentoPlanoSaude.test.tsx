import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { planoSaudeService } from "../../adapters";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { formatarMoeda } from "../../utils/formatadores";
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

  it("na sub-aba Odontológico usa o valor fixo de R$ 13,56 e não mostra campos editáveis por pessoa (só o total de desligados)", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    await user.click(screen.getByRole("button", { name: "Plano Odontológico" }));

    const linha = (await screen.findByText("Carlos Silva")).closest("tr")!;
    // aparece na coluna Titular e no Total (sem campos extras editáveis, o total é o próprio valor fixo)
    expect(within(linha).getAllByText("R$ 13,56")).toHaveLength(2);
    expect(screen.queryByLabelText(/Valor adicional/)).not.toBeInTheDocument();
    // o botão continua existindo — agora salva o total de desligados, que é editável nas duas sub-abas
    expect(screen.getByRole("button", { name: /Salvar lançamento do mês/ })).toBeInTheDocument();
  });

  it("mostra as linhas Total ativos/Total desligados/Total geral, com campos por coluna nos desligados e tudo calculado no geral", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    expect(screen.getByText("Total ativos")).toBeInTheDocument();
    expect(screen.getByText("Total desligados")).toBeInTheDocument();
    expect(screen.getByText("Total geral")).toBeInTheDocument();

    const campoTitular = screen.getByLabelText("Total desligados — Titular");
    const campoDependente = screen.getByLabelText("Total desligados — Dependente");
    const campoAdicional = screen.getByLabelText("Total desligados — Adicional");
    const campoCoparticipacao = screen.getByLabelText("Total desligados — Coparticipação");
    expect(campoTitular).not.toBeDisabled();

    // colunas da linha: [rótulo (colspan), Titular, Dependente, Adicional, Coopart., Total]
    const linhaAtivos = screen.getByText("Total ativos").closest("tr")!;
    const celulaAtivos = within(linhaAtivos).getAllByRole("cell");
    const totalAtivosTitular = Number(celulaAtivos[1].textContent!.replace(/[^\d,-]/g, "").replace(",", "."));
    const totalAtivosGeral = Number(celulaAtivos.at(-1)!.textContent!.replace(/[^\d,-]/g, "").replace(",", "."));

    await user.type(campoTitular, "100");
    await user.type(campoDependente, "50");
    await user.type(campoAdicional, "10");
    await user.type(campoCoparticipacao, "5");

    // linha Total desligados: a coluna Total é calculada como a soma dos 4 campos preenchidos
    const linhaDesligados = screen.getByText("Total desligados").closest("tr")!;
    await waitFor(() => expect(within(linhaDesligados).getByText("R$ 165,00")).toBeInTheDocument());

    // linha Total geral: cada coluna soma ativos + desligados daquela coluna
    const linhaGeral = screen.getByText("Total geral").closest("tr")!;
    const celulasGeral = within(linhaGeral).getAllByRole("cell");
    expect(celulasGeral[1].textContent).toBe(formatarMoeda(totalAtivosTitular + 100));
    expect(celulasGeral.at(-1)!.textContent).toBe(formatarMoeda(totalAtivosGeral + 165));

    await user.click(screen.getByRole("button", { name: /Salvar lançamento do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("Total desligados — Titular")).toHaveValue(100));
  });

  it("recarregando a tela, os campos de Total desligados vêm preenchidos com o que foi salvo (a API agora guarda por coluna)", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    await user.type(screen.getByLabelText("Total desligados — Titular"), "300");
    await user.type(screen.getByLabelText("Total desligados — Dependente"), "40");
    await user.click(screen.getByRole("button", { name: /Salvar lançamento do mês/ }));
    await waitFor(() => expect(screen.getByLabelText("Total desligados — Titular")).toHaveValue(300));
    unmount();

    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    await waitFor(() => expect(screen.getByLabelText("Total desligados — Titular")).toHaveValue(300));
    expect(screen.getByLabelText("Total desligados — Dependente")).toHaveValue(40);
  });

  it("em 'Todas as filiais' os campos de Total desligados ficam desabilitados e mostra o aviso pra escolher uma filial", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <LancamentoPlanoSaude />
        </ComSessao>
      </SessaoProvider>,
    );
    await screen.findByText("Carlos Silva");
    for (const campo of screen.getAllByLabelText(/Total desligados —/)) {
      expect(campo).toBeDisabled();
    }
    expect(screen.getByText(/Selecione uma filial específica no cabeçalho para editar o Total de desligados/)).toBeInTheDocument();
  });

  it("numa filial específica, sem aviso, e os campos de Total desligados mostram 0 (não em branco) quando não há valor lançado", async () => {
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    expect(screen.queryByText(/Selecione uma filial específica no cabeçalho/)).not.toBeInTheDocument();
    for (const campo of screen.getAllByLabelText(/Total desligados —/)) {
      expect(campo).toHaveValue(0);
    }
  });

  it("Admin numa filial específica vê o botão de bloqueio também na sub-aba Odontológico", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    await user.click(screen.getByRole("button", { name: "Plano Odontológico" }));
    expect(screen.getByRole("button", { name: /Bloquear lançamentos deste mês/ })).toBeInTheDocument();
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

  it("dependente com adesão própria desmarcada não aparece na grade, mesmo com o titular aderido", async () => {
    const resDependente = await planoSaudeService.salvarDependente({ vendedorId: "seed-v1", nome: "Maria Silva", cpf: "" });
    expect(resDependente.status).toBe("sucesso");
    if (resDependente.status === "sucesso") {
      await planoSaudeService.salvarAdesaoDependente(resDependente.dados.id, "saude", false);
    }

    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();
  });

  it("barra de busca filtra as linhas exibidas sem afetar o Total ativos", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();

    const linhaAtivosAntes = screen.getByText("Total ativos").closest("tr")!;
    const totalAntes = within(linhaAtivosAntes).getAllByRole("cell").at(-1)!.textContent;

    await user.type(screen.getByLabelText("Buscar titular/dependente"), "carlos");
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();

    const linhaAtivosDepois = screen.getByText("Total ativos").closest("tr")!;
    expect(within(linhaAtivosDepois).getAllByRole("cell").at(-1)!.textContent).toBe(totalAntes);

    await user.clear(screen.getByLabelText("Buscar titular/dependente"));
    await user.type(screen.getByLabelText("Buscar titular/dependente"), "zzz");
    expect(screen.getByText('Nenhum titular/dependente encontrado para "zzz".')).toBeInTheDocument();
  });

  it("o ícone de ajuda ao lado da busca explica que ela não afeta os totais nem a exportação", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ajuda" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/não altera os totais/);
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
