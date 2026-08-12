import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { premiacaoServiceMock } from "../../adapters/mock/premiacaoService.mock";
import { SessaoProvider } from "../../state/SessaoContext";
import { ComoAdminNaFilial } from "../../testUtils/ComoAdminNaFilial";
import { ComSessao } from "../../testUtils/ComSessao";
import { obterMesAtualISO } from "../../utils/periodo";
import { Inicio } from "./Inicio";

beforeEach(() => {
  localStorage.clear();
});

function renderComoAdminNaFilial(filial: string, aoNavegar = vi.fn()) {
  render(
    <SessaoProvider>
      <ComoAdminNaFilial filial={filial}>
        <Inicio aoNavegar={aoNavegar} />
      </ComoAdminNaFilial>
    </SessaoProvider>,
  );
  return aoNavegar;
}

function renderComoCoordenador(aoNavegar = vi.fn()) {
  render(
    <SessaoProvider>
      <ComSessao usuario="coordenador" senha="coord123">
        <Inicio aoNavegar={aoNavegar} />
      </ComSessao>
    </SessaoProvider>,
  );
  return aoNavegar;
}

function renderComoGerente(aoNavegar = vi.fn()) {
  render(
    <SessaoProvider>
      <ComSessao usuario="gerente" senha="gerente123">
        <Inicio aoNavegar={aoNavegar} />
      </ComSessao>
    </SessaoProvider>,
  );
  return aoNavegar;
}

function renderComoVendedor(aoNavegar = vi.fn()) {
  render(
    <SessaoProvider>
      <ComSessao usuario="carlos.silva" senha="venda123">
        <Inicio aoNavegar={aoNavegar} />
      </ComSessao>
    </SessaoProvider>,
  );
  return aoNavegar;
}

describe("Inicio — painel do gestor (F2.INICIO)", () => {
  it("mostra filial, total de colaboradores, premiações lançadas no mês e total a pagar", async () => {
    const mesAtual = obterMesAtualISO();
    await premiacaoServiceMock.salvarPremiacoes("100", mesAtual, [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoAdminNaFilial("100");
    expect(await screen.findByText("Colaboradores cadastrados")).toBeInTheDocument();

    expect(screen.getByText("Filial 100")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // seed-v1, seed-v2, seed-v6 (filial 100)
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    // só 1 dos 2 colaboradores habilitados para premiação de fato lançou algo
    const cartaoPremiacoes = screen.getByText("Premiações lançadas").closest("article")!;
    expect(cartaoPremiacoes.textContent).toContain("1");
  });

  it("Admin em 'Todas as filiais' mostra 'Todas as filiais' no cartão Filial", async () => {
    render(
      <SessaoProvider>
        <ComSessao usuario="admin" senha="admin123">
          <Inicio aoNavegar={vi.fn()} />
        </ComSessao>
      </SessaoProvider>,
    );
    expect(await screen.findByText("Todas as filiais")).toBeInTheDocument();
  });

  it("botão '+ Cadastrar vendedor' navega para 'vendedores'", async () => {
    const user = userEvent.setup();
    const aoNavegar = renderComoAdminNaFilial("100");
    await screen.findByRole("button", { name: "+ Cadastrar vendedor" });

    await user.click(screen.getByRole("button", { name: "+ Cadastrar vendedor" }));
    expect(aoNavegar).toHaveBeenCalledWith("vendedores");
  });

  it("botão '+ Preencher planilha do mês' navega para 'premiacao'", async () => {
    const user = userEvent.setup();
    const aoNavegar = renderComoAdminNaFilial("100");
    const botao = await screen.findByRole("button", { name: "+ Preencher planilha do mês" });

    await user.click(botao);
    expect(aoNavegar).toHaveBeenCalledWith("premiacao");
  });

  it("botão '+ Preencher planilha do mês' some para quem não acessa a tela premiacao (Coordenador)", async () => {
    const aoNavegarCoordenador = renderComoCoordenador();
    await screen.findByText("Colaboradores cadastrados"); // espera o painel carregar

    expect(screen.queryByRole("button", { name: "+ Preencher planilha do mês" })).not.toBeInTheDocument();
    expect(aoNavegarCoordenador).not.toHaveBeenCalled();
  });

  it("botão '+ Cadastrar vendedor' só aparece para Admin (Gerente e Coordenador não cadastram vendedor)", async () => {
    renderComoGerente();
    await screen.findByText("Colaboradores cadastrados");
    expect(screen.queryByRole("button", { name: "+ Cadastrar vendedor" })).not.toBeInTheDocument();
  });

  it("botão '+ Cadastrar vendedor' não aparece para Coordenador", async () => {
    renderComoCoordenador();
    await screen.findByText("Colaboradores cadastrados");
    expect(screen.queryByRole("button", { name: "+ Cadastrar vendedor" })).not.toBeInTheDocument();
  });
});

describe("Inicio — painel do vendedor (F2.INICIO)", () => {
  it("mostra filial, função, premiações recebidas no mês e total a receber, só do próprio vendedor", async () => {
    const mesAtual = obterMesAtualISO();
    await premiacaoServiceMock.salvarPremiacoes("100", mesAtual, [
      { vendedorId: "seed-v1", pev: 100, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
      { vendedorId: "seed-v2", pev: 500, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 },
    ]);

    renderComoVendedor(); // carlos.silva = seed-v1
    expect(await screen.findByText("Minha filial")).toBeInTheDocument();

    expect(screen.getByText("Filial 100")).toBeInTheDocument();
    expect(screen.getByText("Minha função")).toBeInTheDocument();
    expect(screen.getByText("Consultor de Vendas Interno")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument(); // só o de seed-v1, não os R$500 de seed-v2
  });

  it("botão 'Ver minhas premiações por mês' navega para 'consulta'", async () => {
    const user = userEvent.setup();
    const aoNavegar = renderComoVendedor();
    const botao = await screen.findByRole("button", { name: "Ver minhas premiações por mês" });

    await user.click(botao);
    expect(aoNavegar).toHaveBeenCalledWith("consulta");
  });

  it("Vendedor não vê os cartões/ações do painel de gestor", async () => {
    renderComoVendedor();
    await screen.findByText("Minha filial"); // espera o painel carregar

    expect(screen.queryByText("Colaboradores cadastrados")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Cadastrar vendedor" })).not.toBeInTheDocument();
  });
});
