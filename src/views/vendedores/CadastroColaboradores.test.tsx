import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

async function abrirMenuAcoes(user: ReturnType<typeof userEvent.setup>, nomeColaborador: string) {
  await user.click(screen.getByRole("button", { name: `Mais ações de ${nomeColaborador}` }));
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
    expect(screen.queryByRole("button", { name: /Mais ações/ })).not.toBeInTheDocument();
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

describe("CadastroColaboradores — barra de busca", () => {
  it("filtra a lista por nome, sem diferenciar maiúscula/minúscula", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar colaborador"), "fernanda");

    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument();
  });

  it("filtra por CPF, código, e-mail ou usuário de acesso", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("Buscar colaborador"), "111.111.111-11");
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar colaborador"));
    await user.type(screen.getByLabelText("Buscar colaborador"), "carlos.silva");
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();
  });

  it("mostra mensagem de vazio quando a busca não encontra ninguém, sem limpar a lista completa", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("Buscar colaborador"), "ninguem-com-esse-nome");

    expect(await screen.findByText('Nenhum colaborador encontrado para "ninguem-com-esse-nome".')).toBeInTheDocument();
    expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar colaborador"));
    expect(await screen.findByText("Carlos Silva")).toBeInTheDocument();
  });

  it("Gerente (não-admin) também vê e pode usar a barra de busca", async () => {
    const user = userEvent.setup();
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.type(screen.getByLabelText("Buscar colaborador"), "fernanda");
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument();
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

  it("valida nome, CPF e e-mail obrigatórios antes de salvar (código é opcional, como na API)", async () => {
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

  it("cadastra sem preencher Código (a API só exige código para gerar V001-style, é opcional)", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    await user.type(screen.getByLabelText("Nome completo"), "Colaborador Sem Código");
    await user.type(screen.getByLabelText("CPF"), "55566677788");
    await user.type(screen.getByLabelText("E-mail"), "sem.codigo@comercialmariano.com.br");
    await user.type(screen.getByLabelText("Usuário de acesso"), "sem.codigo");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Colaborador Sem Código")).toBeInTheDocument();
  });

  it("cadastra um novo colaborador, fecha a modal e ele aparece na tabela", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    await user.type(screen.getByLabelText("Código"), "010");
    await user.type(screen.getByLabelText("Nome completo"), "Novo Colaborador");
    await user.type(screen.getByLabelText("CPF"), "12345678900");
    await user.type(screen.getByLabelText("E-mail"), "novo.colaborador@comercialmariano.com.br");
    await user.type(screen.getByLabelText("Usuário de acesso"), "novo.colaborador");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Novo Colaborador")).toBeInTheDocument();
  });

  it("o campo Perfil vem com 'Vendedor' selecionado por padrão e aceita as 4 opções", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));

    const campoPerfil = screen.getByLabelText("Perfil");
    expect(campoPerfil).toHaveValue("vendedor");
    expect(within(campoPerfil).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Vendedor",
      "Coordenador",
      "Gerente",
      "Administrador",
    ]);

    await user.selectOptions(campoPerfil, "gerente");
    await user.type(screen.getByLabelText("Código"), "030");
    await user.type(screen.getByLabelText("Nome completo"), "Novo Gerente");
    await user.type(screen.getByLabelText("CPF"), "11122233344");
    await user.type(screen.getByLabelText("E-mail"), "novo.gerente@comercialmariano.com.br");
    await user.type(screen.getByLabelText("Usuário de acesso"), "novo.gerente");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const linha = (await screen.findByText("Novo Gerente")).closest("tr")!;
    expect(within(linha).getByText("Gerente")).toBeInTheDocument();
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
    await user.type(screen.getByLabelText("E-mail"), "colab.401@comercialmariano.com.br");
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

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));

    expect(screen.getByRole("dialog", { name: "Editar colaborador" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Carlos Silva");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Nada foi alterado.
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
  });

  it("Editar não exige senha — deixar em branco mantém a senha atual e salva normalmente", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(screen.getByLabelText("Senha de acesso")).not.toBeRequired();

    await user.clear(screen.getByLabelText("Senha de acesso"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
  });

  it("Remover tira o colaborador da lista", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Remover" }));

    await waitFor(() => expect(screen.queryByText("Carlos Silva")).not.toBeInTheDocument());
  });

  it("Inativar colaborador grava 'desligado: true' e o menu passa a oferecer 'Ativar colaborador'", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    const linha = (await waitFor(() => screen.getByText("Carlos Silva"))).closest("tr")!;
    expect(within(linha).getByText("Ativo")).toBeInTheDocument();

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Inativar colaborador" }));

    await waitFor(() => expect(within(linha).getByText("Inativo")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    expect(screen.getByRole("menuitem", { name: "Ativar colaborador" })).toBeInTheDocument();
  });

  it("Ativar colaborador (reverso) grava 'desligado: false' e o badge volta a Ativo", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    const linha = (await waitFor(() => screen.getByText("Carlos Silva"))).closest("tr")!;

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Inativar colaborador" }));
    await waitFor(() => expect(within(linha).getByText("Inativo")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Ativar colaborador" }));
    await waitFor(() => expect(within(linha).getByText("Ativo")).toBeInTheDocument());
  });

  it("editar outros campos de um colaborador inativado não reativa ele por engano", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    const linha = (await waitFor(() => screen.getByText("Carlos Silva"))).closest("tr")!;

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Inativar colaborador" }));
    await waitFor(() => expect(within(linha).getByText("Inativo")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(screen.getByText("Carlos Silva").closest("tr")!).getByText("Inativo")).toBeInTheDocument();
  });

  it("Resetar senha grava a senha do colaborador como o próprio CPF", async () => {
    const user = userEvent.setup();
    const espiao = vi.spyOn(colaboradoresService, "salvarColaborador");
    renderComoAdminNaFilial("100");
    const linha = (await waitFor(() => screen.getByText("Carlos Silva"))).closest("tr")!;
    const cpf = within(linha).getByText(/\d{3}\.\d{3}\.\d{3}-\d{2}/).textContent!;

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(screen.getByRole("menuitem", { name: "Resetar senha" }));

    await waitFor(() => expect(espiao).toHaveBeenCalled());
    const argumento = espiao.mock.calls[0][0];
    expect(argumento.senhaAcesso).toBe(cpf);
    expect(argumento.nome).toBe("Carlos Silva");

    espiao.mockRestore();
  });

  it("o menu de ações fecha ao apertar Escape ou clicar fora", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await abrirMenuAcoes(user, "Carlos Silva");
    expect(screen.getByRole("menuitem", { name: "Editar" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem", { name: "Editar" })).not.toBeInTheDocument();

    await abrirMenuAcoes(user, "Carlos Silva");
    await user.click(document.body);
    expect(screen.queryByRole("menuitem", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("mostra o efeito de carregamento no botão Cadastrar enquanto salva, e desliga ao terminar", async () => {
    const user = userEvent.setup();
    let resolverSalvar!: (valor: Awaited<ReturnType<typeof colaboradoresService.salvarColaborador>>) => void;
    const espiao = vi
      .spyOn(colaboradoresService, "salvarColaborador")
      .mockReturnValue(new Promise((resolve) => (resolverSalvar = resolve)));

    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar colaborador/ }));
    await user.type(screen.getByLabelText("Código"), "010");
    await user.type(screen.getByLabelText("Nome completo"), "Novo Colaborador");
    await user.type(screen.getByLabelText("CPF"), "12345678900");
    await user.type(screen.getByLabelText("E-mail"), "novo.colaborador@comercialmariano.com.br");
    await user.type(screen.getByLabelText("Usuário de acesso"), "novo.colaborador");
    await user.type(screen.getByLabelText("Senha de acesso"), "venda123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    const botaoCadastrar = screen.getByRole("button", { name: "Cadastrar" });
    expect(botaoCadastrar).toBeDisabled();
    expect(botaoCadastrar).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    resolverSalvar({ status: "sucesso", dados: { id: "novo" } as never });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    espiao.mockRestore();
  });
});
