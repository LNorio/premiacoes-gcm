import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { premiacaoServiceMock } from "../../adapters/mock/premiacaoService.mock";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComSessao } from "../../testUtils/ComSessao";
import { obterMesPassadoISO } from "../../utils/periodo";
import { ConsultaPeriodo } from "./ConsultaPeriodo";

const MES_PASSADO = obterMesPassadoISO();

beforeEach(() => {
  localStorage.clear();
});

/** Limpa o filtro padrão (mês passado, ver F3.CONS-08) para os testes que precisam ver todos os meses. */
async function verTodosOsMeses() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Ver todos os meses" }));
}

function renderComoVendedor() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="carlos.silva" senha="venda123">
        <ConsultaPeriodo />
      </ComSessao>
    </SessaoProvider>,
  );
}

function renderComoGerente() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <ConsultaPeriodo />
      </ComSessao>
    </SessaoProvider>,
  );
}

function renderComoAdminEmTodasAsFiliais() {
  return render(
    <SessaoProvider>
      <ComSessao usuario="admin" senha="admin123">
        <ConsultaPeriodo />
      </ComSessao>
    </SessaoProvider>,
  );
}

describe("ConsultaPeriodo — cartões por mês (F3.CONS-01/02/03)", () => {
  it("agrupa os lançamentos em um cartão por mês, mais recente primeiro", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-05", [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-07", [
      { vendedorId: "seed-v1", pev: 200, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoGerente();
    await verTodosOsMeses();
    const cartoes = await screen.findAllByText(/lançamento\(s\)/);
    expect(cartoes).toHaveLength(2);

    const titulos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titulos[0]).toContain("2026"); // julho (mais recente) vem antes de maio
    expect(titulos[0]).toMatch(/julho/i);
    expect(titulos[1]).toMatch(/maio/i);
  });

  it("mostra mensagem vazia quando não há premiações lançadas", async () => {
    renderComoGerente();
    await verTodosOsMeses();
    expect(await screen.findByText(/Nenhuma premiação lançada ainda/)).toBeInTheDocument();
  });
});

describe("ConsultaPeriodo — filtro padrão do primeiro carregamento (F3.CONS-08)", () => {
  it("traz só o mês passado por padrão, sem precisar filtrar", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", MES_PASSADO, [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    await premiacaoServiceMock.salvarPremiacoes("100", "2020-01", [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoGerente();
    await waitFor(() => expect(screen.getAllByText(/lançamento\(s\)/)).toHaveLength(1));
    expect(screen.getByLabelText("De")).toHaveValue(MES_PASSADO);
    expect(screen.getByLabelText("Até")).toHaveValue(MES_PASSADO);
  });
});

describe("ConsultaPeriodo — escopo por perfil (F3.CONS-06)", () => {
  it("Vendedor vê só os próprios lançamentos, com título 'Minhas Premiações'", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", MES_PASSADO, [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
      { vendedorId: "seed-v2", pev: 300, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoVendedor(); // carlos.silva = seed-v1
    expect(await screen.findByRole("heading", { name: "Minhas Premiações por Período" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.queryByText("Fernanda Lima")).not.toBeInTheDocument();
  });

  it("Vendedor não vê o botão de exportar CSV", async () => {
    renderComoVendedor();
    await waitFor(() => expect(screen.getByText(/Nenhuma premiação/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Exportar CSV/ })).not.toBeInTheDocument();
  });

  it("Admin em 'Todas as filiais' vê a coluna Filial", async () => {
    await premiacaoServiceMock.salvarPremiacoes("100", MES_PASSADO, [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    renderComoAdminEmTodasAsFiliais();
    await waitFor(() => expect(screen.getByText("Carlos Silva")).toBeInTheDocument());
    expect(screen.getByText("Filial 100")).toBeInTheDocument();
  });
});

describe("ConsultaPeriodo — filtros (F3.CONS-08)", () => {
  it("filtra por período e 'Ver todos os meses' limpa o filtro", async () => {
    const user = userEvent.setup();
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-01", [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);
    await premiacaoServiceMock.salvarPremiacoes("100", "2026-08", [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoGerente();
    await verTodosOsMeses();
    await waitFor(() => expect(screen.getAllByText(/lançamento\(s\)/)).toHaveLength(2));

    await user.type(screen.getByLabelText("De"), "2026-06");
    await waitFor(() => expect(screen.getAllByText(/lançamento\(s\)/)).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Ver todos os meses" }));
    await waitFor(() => expect(screen.getAllByText(/lançamento\(s\)/)).toHaveLength(2));
  });
});
