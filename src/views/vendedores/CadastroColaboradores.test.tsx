import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { CadastroColaboradores } from "./CadastroColaboradores";

beforeEach(() => {
  localStorage.clear();
});

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <CadastroColaboradores />
      </ComSessao>
    </SessaoProvider>,
  );
}

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <CadastroColaboradores />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoAdminEmTodasAsFiliais() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="admin" senha="admin123">
        <CadastroColaboradores />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("CadastroColaboradores — visibilidade por perfil", () => {
  it("Gerente vê a listagem da própria filial, sem colaboradores de outra filial", async () => {
    renderComoGerente(); // gerente é da filial 100
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.queryByText("Roberto Santos")).not.toBeInTheDocument(); // filial 401
  });

  it("Gerente (não-admin) não vê o formulário nem a coluna de Ações", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByPlaceholderText("Código")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("Admin em 'Todas as filiais' vê o formulário com o campo de Filial e a coluna Filial na listagem", async () => {
    renderComoAdminEmTodasAsFiliais();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Código")).toBeInTheDocument();
    expect(screen.getByLabelText("Filial")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Filial" })).toBeInTheDocument();
  });

  it("mostra as telas habilitadas de cada colaborador como badges", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(within(linha).getByText("Premiações")).toBeInTheDocument();
    expect(within(linha).getByText("Comissão")).toBeInTheDocument();
  });
});

describe("CadastroColaboradores — formulário (Admin numa filial específica)", () => {
  it("valida código, nome e CPF obrigatórios antes de salvar", async () => {
    const user = userEvent.setup();
    const { container } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByPlaceholderText("Código")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    // Não deve ter criado um 4º colaborador na filial 100 (Carlos, Fernanda, Patricia).
    await waitFor(() => {
      const tabelaListagem = container.querySelector(".tabela-wrapper table:not(.tabela-planilha)")!;
      expect(tabelaListagem.querySelectorAll("tbody tr")).toHaveLength(3);
    });
  });

  it("cadastra um novo colaborador e ele aparece na tabela, já com a filial padrão da sessão", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByPlaceholderText("Código")).toBeInTheDocument());

    expect(screen.getByLabelText("Filial")).toHaveValue("100");

    await user.type(screen.getByPlaceholderText("Código"), "010");
    await user.type(screen.getByPlaceholderText("Nome completo"), "Novo Colaborador");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "12345678900");
    await user.type(screen.getByPlaceholderText("usuario.acesso"), "novo.colaborador");
    await user.type(screen.getByPlaceholderText("senha"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Novo Colaborador")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Código")).toHaveValue(""); // formulário limpo após salvar
  });

  it("Editar carrega os dados do colaborador no formulário e permite cancelar", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(screen.getByDisplayValue("Carlos Silva")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Carlos Silva")).not.toBeInTheDocument();
  });

  it("Remover tira o colaborador da lista", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getAllByRole("button", { name: "Remover" })[0]);

    await waitFor(() => expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument());
  });
});

describe("CadastroColaboradores — formulário (Admin em 'Todas as filiais')", () => {
  it("cadastra um colaborador escolhendo a filial no próprio formulário", async () => {
    const user = userEvent.setup();
    renderComoAdminEmTodasAsFiliais();
    await waitFor(() => expect(screen.getByPlaceholderText("Código")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("Código"), "020");
    await user.type(screen.getByPlaceholderText("Nome completo"), "Colaborador Filial 401");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "98765432100");
    await user.selectOptions(screen.getByLabelText("Filial"), "401");
    await user.type(screen.getByPlaceholderText("usuario.acesso"), "colaborador.401");
    await user.type(screen.getByPlaceholderText("senha"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.getByText("Colaborador Filial 401")).toBeInTheDocument());
    const linha = screen.getByText("Colaborador Filial 401").closest("tr")!;
    expect(within(linha).getByText("Filial 401")).toBeInTheDocument();
  });
});
