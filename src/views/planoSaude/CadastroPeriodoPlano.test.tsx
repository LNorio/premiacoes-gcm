import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { CadastroPeriodoPlano } from "./CadastroPeriodoPlano";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <CadastroPeriodoPlano />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

async function abrirModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "+ Novo período" }));
  return screen.getByRole("dialog");
}

describe("CadastroPeriodoPlano — período do plano por filial (Admin)", () => {
  it("Admin em 'Todas as filiais' vê o pedido para selecionar uma filial específica", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <CadastroPeriodoPlano />
        </ComSessao>
      </SessaoProvider>,
    );
    expect(await screen.findByText(/Selecione uma filial específica/)).toBeInTheDocument();
  });

  it("Admin numa filial específica vê Titular e Dependente na mesma lista, com a coluna Tipo de Pessoa", async () => {
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    const linhas = screen.getAllByRole("row").slice(1); // sem o cabeçalho
    expect(linhas).toHaveLength(2);

    const linhaTitular = screen.getByText("Titular").closest("tr")!;
    expect(within(linhaTitular).getByText("R$ 185,27")).toBeInTheDocument();
    expect(within(linhaTitular).getByText("Vigente")).toBeInTheDocument();

    const linhaDependente = screen.getByText("Dependente").closest("tr")!;
    expect(within(linhaDependente).getByText("R$ 185,27")).toBeInTheDocument();
    expect(within(linhaDependente).getByText("Vigente")).toBeInTheDocument();
  });

  it("usa o valor diferenciado semeado (R$ 255,54) para a filial 401, em Titular e Dependente", async () => {
    renderComoAdminNaFilial("401");
    await screen.findAllByText("01/01/2000");
    expect(screen.getAllByText("R$ 255,54")).toHaveLength(2);
  });

  it("na sub-aba Odontológico mostra o período semeado de R$ 13,56 para Titular e Dependente", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await user.click(screen.getByRole("button", { name: "Plano Odontológico" }));

    await waitFor(() => expect(screen.getAllByText("R$ 13,56")).toHaveLength(2));
  });

  it("botão '+ Novo período' abre uma modal com os 4 campos", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    const modal = await abrirModal(user);
    expect(within(modal).getByLabelText("Data de Início")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Valor Titular")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Valor Dependente")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Data de Encerramento")).toBeInTheDocument();
  });

  it("rejeita cadastrar sem preencher nenhum dos dois valores", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await abrirModal(user);
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    // nada muda — continua só com os 2 períodos semeados
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(3)); // cabeçalho + 2
  });

  it("rejeita cadastrar um novo período de Titular enquanto já existe um vigente, mesmo preenchendo só esse campo", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await abrirModal(user);
    await user.type(screen.getByLabelText("Valor Titular"), "200");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(3)); // cabeçalho + 2, nada novo criado
    expect(screen.queryByText("R$ 200,00")).not.toBeInTheDocument();
  });

  it("Admin encerra o período vigente de Titular e cadastra um novo preenchendo só o campo de Titular, sem afetar o de Dependente", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    const linhaTitular = screen.getByText("Titular").closest("tr")!;
    await user.click(within(linhaTitular).getByRole("button", { name: "Encerrar vigência" }));
    await waitFor(() => expect(within(screen.getByText("Titular").closest("tr")!).getByText("Encerrado")).toBeInTheDocument());

    await abrirModal(user);
    await user.type(screen.getByLabelText("Valor Titular"), "220");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(screen.getByText("R$ 220,00")).toBeInTheDocument());
    // Dependente continua vigente e com o valor original, sem qualquer alteração
    const linhaDependente = screen.getByText("Dependente").closest("tr")!;
    expect(within(linhaDependente).getByText("R$ 185,27")).toBeInTheDocument();
    expect(within(linhaDependente).getByText("Vigente")).toBeInTheDocument();
  });

  it("preenchendo Titular e Dependente ao mesmo tempo, cadastra um período pra cada", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    // encerra os dois vigentes semeados primeiro, senão o cadastro duplo seria recusado — reconsulta
    // o botão a cada clique, já que o anterior some do DOM assim que o período dele é encerrado.
    await user.click(screen.getAllByRole("button", { name: "Encerrar vigência" })[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Encerrar vigência" })).toHaveLength(1));
    await user.click(screen.getAllByRole("button", { name: "Encerrar vigência" })[0]);
    await waitFor(() => expect(screen.getAllByText("Encerrado")).toHaveLength(2));

    await abrirModal(user);
    await user.type(screen.getByLabelText("Valor Titular"), "300");
    await user.type(screen.getByLabelText("Valor Dependente"), "150");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(screen.getByText("R$ 300,00")).toBeInTheDocument());
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument();
    expect(screen.getAllByText("Vigente")).toHaveLength(2);
  });

  it("preenchendo Data de Encerramento no cadastro, o período já é criado e encerrado nessa data", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await user.click(screen.getAllByRole("button", { name: "Encerrar vigência" })[0]);
    await waitFor(() => expect(screen.getAllByText("Encerrado")).toHaveLength(1));

    await abrirModal(user);
    await user.type(screen.getByLabelText("Valor Titular"), "400");
    fireEvent.change(screen.getByLabelText("Data de Encerramento"), { target: { value: "2026-12-31" } });

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    const linhaNova = await screen.findByText("R$ 400,00");
    const linha = linhaNova.closest("tr")!;
    expect(within(linha).getByText("Encerrado")).toBeInTheDocument();
    expect(within(linha).getByText("31/12/2026")).toBeInTheDocument();
    expect(within(linha).queryByRole("button", { name: "Encerrar vigência" })).not.toBeInTheDocument();
  });

  it("Data de Início pode ser retroativa e aparece na lista com a data escolhida", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await user.click(screen.getAllByRole("button", { name: "Encerrar vigência" })[0]);
    await waitFor(() => expect(screen.getAllByText("Encerrado")).toHaveLength(1));

    await abrirModal(user);
    fireEvent.change(screen.getByLabelText("Data de Início"), { target: { value: "2020-01-01" } });
    await user.type(screen.getByLabelText("Valor Titular"), "210");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    const linhaNova = await screen.findByText("R$ 210,00");
    const linha = linhaNova.closest("tr")!;
    expect(within(linha).getByText("01/01/2020")).toBeInTheDocument();
    expect(within(linha).getByText("Vigente")).toBeInTheDocument();
  });

  it("rejeita quando a Data de Encerramento é anterior à Data de Início", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");

    await user.click(screen.getAllByRole("button", { name: "Encerrar vigência" })[0]);
    await waitFor(() => expect(screen.getAllByText("Encerrado")).toHaveLength(1));

    await abrirModal(user);
    fireEvent.change(screen.getByLabelText("Data de Início"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText("Data de Encerramento"), { target: { value: "2026-01-01" } });
    await user.type(screen.getByLabelText("Valor Titular"), "210");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    // continua na modal, nada foi criado
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("R$ 210,00")).not.toBeInTheDocument();
  });

  it("não tem botão de remover período — só de encerrar vigência", async () => {
    renderComoAdminNaFilial("100");
    await screen.findAllByText("01/01/2000");
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  });
});
