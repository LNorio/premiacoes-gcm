import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { colaboradoresService } from "../../adapters";
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

describe("CadastroColaboradores — visibilidade por perfil", () => {
  it("Gerente vê a listagem da própria filial, sem colaboradores de outra filial", async () => {
    renderComoGerente(); // gerente é da filial 100
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.queryByText("Roberto Santos")).not.toBeInTheDocument(); // filial 401
  });

  it("Gerente (não-admin) não vê o botão de adicionar nem a coluna de Ações", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Adicionar colaborador/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("Admin em 'Todas as filiais' também vê o botão de adicionar, com o seletor de Filial na modal", async () => {
    const user = userEvent.setup();
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <CadastroColaboradores />
        </ComSessao>
      </SessaoProvider>,
    );
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Filial")).toBeInTheDocument();
  });

  it("mostra as telas habilitadas de cada colaborador como badges", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(within(linha).getByText("Premiações")).toBeInTheDocument();
    expect(within(linha).getByText("Comissão")).toBeInTheDocument();
  });
});

describe("CadastroColaboradores — modal de adicionar/editar (Admin numa filial específica)", () => {
  it("o botão '+ Adicionar colaborador' abre a modal vazia", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    expect(screen.getByRole("dialog", { name: "Adicionar colaborador" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toHaveValue("");
  });

  it("valida código, nome e CPF obrigatórios antes de salvar", async () => {
    const user = userEvent.setup();
    const { container } = renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    // Modal continua aberta e nenhum 4º colaborador foi criado na filial 100 (Carlos, Fernanda, Patricia).
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const tabelaListagem = container.querySelector(".tabela-wrapper table")!;
    expect(tabelaListagem.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("cadastra um novo colaborador, fecha a modal e ele aparece na tabela", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    await user.type(screen.getByLabelText("Código"), "010");
    await user.type(screen.getByLabelText("Nome completo"), "Novo Colaborador");
    await user.type(screen.getByLabelText("CPF"), "12345678900");
    await user.type(screen.getByLabelText("Usuário de acesso"), "novo.colaborador");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Novo Colaborador")).toBeInTheDocument();
  });

  it("o campo Filial vem pré-preenchido com a filial ativa, mas pode ser trocado ao cadastrar", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));

    expect(screen.getByLabelText("Filial")).toHaveValue("100");

    await user.selectOptions(screen.getByLabelText("Filial"), "401");
    await user.type(screen.getByLabelText("Código"), "020");
    await user.type(screen.getByLabelText("Nome completo"), "Colaborador Filial 401");
    await user.type(screen.getByLabelText("CPF"), "98765432100");
    await user.type(screen.getByLabelText("Usuário de acesso"), "colab.401");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    // Salvo para a filial 401 — não deve aparecer na listagem da filial 100 (ativa na sessão).
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Colaborador Filial 401")).not.toBeInTheDocument();

    const salvos = await colaboradoresService.listarColaboradores("401");
    expect(salvos.status === "sucesso" && salvos.dados.some((c) => c.nome === "Colaborador Filial 401")).toBe(true);
  });

  it("Editar abre a modal preenchida e permite cancelar sem salvar", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(screen.getByRole("dialog", { name: "Editar colaborador" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Carlos Silva");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Nada foi alterado.
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
  });

  it("Remover tira o colaborador da lista", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getAllByRole("button", { name: "Remover" })[0]);

    await waitFor(() => expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument());
  });
});
