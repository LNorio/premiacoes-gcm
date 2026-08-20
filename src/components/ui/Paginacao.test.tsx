import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Paginacao } from "./Paginacao";

describe("Paginacao", () => {
  it("não renderiza nada quando não há itens", () => {
    const { container } = render(
      <Paginacao paginaAtual={1} totalPaginas={1} tamanhoPagina={10} totalItens={0} onIrParaPagina={vi.fn()} onMudarTamanho={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra a faixa de itens exibida e desabilita 'anterior' na primeira página", () => {
    render(
      <Paginacao paginaAtual={1} totalPaginas={3} tamanhoPagina={10} totalItens={25} onIrParaPagina={vi.fn()} onMudarTamanho={vi.fn()} />,
    );
    expect(screen.getByText("1–10 de 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
  });

  it("desabilita 'próxima' na última página e mostra a faixa certa", () => {
    render(
      <Paginacao paginaAtual={3} totalPaginas={3} tamanhoPagina={10} totalItens={25} onIrParaPagina={vi.fn()} onMudarTamanho={vi.fn()} />,
    );
    expect(screen.getByText("21–25 de 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it("clicar num número de página chama onIrParaPagina com o número certo", async () => {
    const user = userEvent.setup();
    const onIrParaPagina = vi.fn();
    render(
      <Paginacao
        paginaAtual={1}
        totalPaginas={3}
        tamanhoPagina={10}
        totalItens={25}
        onIrParaPagina={onIrParaPagina}
        onMudarTamanho={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Página 2" }));
    expect(onIrParaPagina).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onIrParaPagina).toHaveBeenCalledWith(2); // paginaAtual (prop) continua 1 nesse render, então +1 = 2
  });

  it("trocar o seletor de linhas por página chama onMudarTamanho", async () => {
    const user = userEvent.setup();
    const onMudarTamanho = vi.fn();
    render(
      <Paginacao
        paginaAtual={1}
        totalPaginas={1}
        tamanhoPagina={10}
        totalItens={5}
        onIrParaPagina={vi.fn()}
        onMudarTamanho={onMudarTamanho}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Linhas por página"), "50");
    expect(onMudarTamanho).toHaveBeenCalledWith(50);
  });

  it("com muitas páginas, mostra reticências entre a vizinhança da atual e os extremos", () => {
    render(
      <Paginacao paginaAtual={5} totalPaginas={10} tamanhoPagina={10} totalItens={100} onIrParaPagina={vi.fn()} onMudarTamanho={vi.fn()} />,
    );
    // 1 … 4 5 6 … 10
    expect(screen.getByRole("button", { name: "Página 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 5" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 10" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Página 2" })).not.toBeInTheDocument();
    expect(screen.getAllByText("…")).toHaveLength(2);
  });
});
