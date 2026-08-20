import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { CadastroTitulares } from "./CadastroTitulares";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <CadastroTitulares />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoCoordenador() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="coordenador" senha="coord123">
        <CadastroTitulares />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("CadastroTitulares — titulares e dependentes (F5.PS-CAD)", () => {
  it("lista os titulares da filial com adesão marcada por padrão (undefined tratado como true)", async () => {
    renderComoAdminNaFilial("100");
    expect(await screen.findByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();
    expect(screen.getByText("Patricia Ferreira")).toBeInTheDocument();

    expect(screen.getByLabelText("Plano de Saúde de Carlos Silva")).toBeChecked();
    expect(screen.getByLabelText("Plano Odontológico de Carlos Silva")).toBeChecked();
  });

  it("Admin desmarca a adesão de um titular e a mudança persiste", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    const checkboxSaude = await screen.findByLabelText("Plano de Saúde de Carlos Silva");
    expect(checkboxSaude).toBeChecked();

    await user.click(checkboxSaude);
    await waitFor(() => expect(checkboxSaude).not.toBeChecked());
  });

  it("Coordenador vê as checkboxes desabilitadas (titular e dependente) e sem os botões de gerenciar dependente", async () => {
    const user = userEvent.setup();
    const { unmount } = renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");
    await user.click(within(screen.getByText("Carlos Silva").closest("tr")!).getByRole("button", { name: "+ Dependente" }));
    await user.type(await screen.findByLabelText("Nome completo"), "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await screen.findByText("Ana Silva");
    unmount();

    renderComoCoordenador();
    const checkboxSaude = await screen.findByLabelText("Plano de Saúde de Carlos Silva");
    expect(checkboxSaude).toBeDisabled();
    expect(screen.getByLabelText("Plano de Saúde de Ana Silva")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "+ Dependente" })).not.toBeInTheDocument();
  });

  it("Admin adiciona um dependente pela modal e ele aparece indentado, com adesão própria marcada por padrão", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Dependente" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome completo"), "Maria Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const linhaDependente = (await screen.findByText("Maria Silva")).closest("tr")!;
    expect(within(linhaDependente).getByText("Dependente")).toBeInTheDocument();
    // adesão do dependente é própria (não mais um espelho do titular) — undefined tratado como aderido
    expect(within(linhaDependente).getByLabelText("Plano de Saúde de Maria Silva")).toBeChecked();
    expect(within(linhaDependente).getByLabelText("Plano Odontológico de Maria Silva")).toBeChecked();
  });

  it("Admin desmarca a adesão de um dependente, independente do titular", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Dependente" }));
    await user.type(await screen.findByLabelText("Nome completo"), "João Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await screen.findByText("João Silva");

    const checkboxSaudeDependente = screen.getByLabelText("Plano de Saúde de João Silva");
    expect(checkboxSaudeDependente).toBeChecked();
    await user.click(checkboxSaudeDependente);
    await waitFor(() => expect(checkboxSaudeDependente).not.toBeChecked());

    // titular continua aderido normalmente — a mudança foi só do dependente
    expect(screen.getByLabelText("Plano de Saúde de Carlos Silva")).toBeChecked();
  });

  it("Admin remove um dependente já cadastrado", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Dependente" }));
    await user.type(await screen.findByLabelText("Nome completo"), "João Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await screen.findByText("João Silva");

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await waitFor(() => expect(screen.queryByText("João Silva")).not.toBeInTheDocument());
  });

  it("barra de busca filtra por titular, e por dependente mantém a família (titular) visível", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva");

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Dependente" }));
    await user.type(await screen.findByLabelText("Nome completo"), "Maria Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await screen.findByText("Maria Silva");
    expect(screen.getByText("Fernanda Lima")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar titular/dependente"), "carlos");
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar titular/dependente"));
    await user.type(screen.getByLabelText("Buscar titular/dependente"), "maria");
    // busca bateu no dependente — o titular (Carlos) continua visível pra dar contexto da família
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar titular/dependente"));
    await user.type(screen.getByLabelText("Buscar titular/dependente"), "zzz");
    expect(screen.getByText('Nenhum titular/dependente encontrado para "zzz".')).toBeInTheDocument();
  });

  it("mostra a paginação por titular (contando titulares, não linhas de dependente)", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Carlos Silva"); // Carlos, Fernanda, Patricia — 3 titulares na filial 100
    expect(screen.getByText("1–3 de 3")).toBeInTheDocument();

    const linhaCarlos = screen.getByText("Carlos Silva").closest("tr")!;
    await user.click(within(linhaCarlos).getByRole("button", { name: "+ Dependente" }));
    await user.type(await screen.findByLabelText("Nome completo"), "Maria Silva");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await screen.findByText("Maria Silva");

    // um dependente a mais não muda a contagem de "unidades" da paginação (ainda 3 titulares)
    expect(screen.getByText("1–3 de 3")).toBeInTheDocument();
  });

  it("Admin em 'Todas as filiais' vê a coluna Filial", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <CadastroTitulares />
        </ComSessao>
      </SessaoProvider>,
    );
    await screen.findByText("Carlos Silva");
    expect(screen.getByRole("columnheader", { name: "Filial" })).toBeInTheDocument();
    const linhaRoberto = screen.getByText("Roberto Santos").closest("tr")!;
    expect(within(linhaRoberto).getByText("Filial 401")).toBeInTheDocument();
  });
});
