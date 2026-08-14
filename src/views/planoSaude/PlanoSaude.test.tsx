import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { PlanoSaude } from "./PlanoSaude";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <PlanoSaude />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

describe("PlanoSaude — sub-abas (F5.PS-CAD-01/F5.PS-LAN-01/F5.PS-LAN-06)", () => {
  it("começa na sub-aba Titulares e Dependentes e troca para Lançamento ao clicar", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");

    expect(await screen.findByText("Titulares e dependentes")).toBeInTheDocument();
    expect(screen.queryByText("Lançamento mensal do desconto")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lançamento" }));
    expect(await screen.findByText("Lançamento mensal do desconto")).toBeInTheDocument();
    expect(screen.queryByText("Titulares e dependentes")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Titulares e Dependentes" }));
    expect(await screen.findByText("Titulares e dependentes")).toBeInTheDocument();
  });

  it("Admin vê a sub-aba Período do Plano e consegue trocar para ela", async () => {
    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await screen.findByText("Titulares e dependentes");

    await user.click(screen.getByRole("button", { name: "Período do Plano" }));
    expect(await screen.findByText("Período do plano")).toBeInTheDocument();
  });

  it("Coordenador não vê a sub-aba Período do Plano", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="coordenador" senha="coord123">
          <PlanoSaude />
        </ComSessao>
      </SessaoProvider>,
    );
    await screen.findByText("Titulares e dependentes");
    expect(screen.queryByRole("button", { name: "Período do Plano" })).not.toBeInTheDocument();
  });
});
