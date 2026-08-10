import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { premiacaoServiceMock } from "../../adapters/mock/premiacaoService.mock";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { ConsolidadoPev } from "./ConsolidadoPev";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string) {
  return render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <ConsolidadoPev />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
}

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <ConsolidadoPev />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("ConsolidadoPev — estrutura e colunas dinâmicas (F3.PEV-01/02/03)", () => {
  it("lista os colaboradores habilitados e soma o PEV lançado no mês corrente", async () => {
    const mes = obterMesAtualISO();
    await premiacaoServiceMock.salvarPremiacoes("100", mes, [
      { vendedorId: "seed-v1", pev: 1000, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    expect(linha.textContent).toContain(formatarMoeda(1000)); // Total Acumulado
    expect(linha.textContent).toContain(formatarMoeda(280)); // Base de Cálculo = 28%
  });
});

describe("ConsolidadoPev — adiantamento de férias (F3.PEV-04/05/06)", () => {
  it("Admin edita e salva o adiantamento; a Premiação Adicional a Receber é recalculada", async () => {
    const mes = obterMesAtualISO();
    await premiacaoServiceMock.salvarPremiacoes("100", mes, [
      { vendedorId: "seed-v1", pev: 1000, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    const user = userEvent.setup();
    renderComoAdminNaFilial("100");
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const campoAdiantamento = screen.getByLabelText("Adiantamento de férias de Carlos Silva");
    await user.type(campoAdiantamento, "100");

    // Base 280 - Adiantamento 100 = 180, recalculado sem re-render das linhas
    const linha = screen.getByText("Carlos Silva").closest("tr")!;
    await waitFor(() => expect(linha.textContent).toContain(formatarMoeda(180)));

    await user.click(screen.getByRole("button", { name: /Salvar adiantamentos de férias/ }));
    await waitFor(() => expect(campoAdiantamento).toHaveValue(100));
  });

  it("Gerente não edita o adiantamento (célula somente leitura)", async () => {
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByLabelText("Adiantamento de férias de Carlos Silva")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Salvar adiantamentos de férias/ })).not.toBeInTheDocument();
  });
});

describe("ConsolidadoPev — filtros (F3.PEV-08)", () => {
  it("mostra erro quando 'De' vem depois de 'Até'", async () => {
    const user = userEvent.setup();
    renderComoGerente();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());

    const campoDe = screen.getByLabelText("De");
    await user.clear(campoDe);
    await user.type(campoDe, "2030-01");

    expect(await screen.findByText(/não pode ser posterior/)).toBeInTheDocument();
  });
});
