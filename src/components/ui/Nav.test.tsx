import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Nav } from "./Nav";

const itens = [
  { chave: "inicio", rotulo: "Início" },
  { chave: "premiacao", rotulo: "Premiação" },
];

describe("Nav", () => {
  it("marca o item ativo com a classe e aria-current", () => {
    render(<Nav itens={itens} ativa="premiacao" onSelecionar={() => {}} />);
    expect(screen.getByRole("button", { name: "Premiação" })).toHaveClass("nav-item", "ativo");
    expect(screen.getByRole("button", { name: "Premiação" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Início" })).not.toHaveClass("ativo");
  });

  it("chama onSelecionar com a chave do item clicado", () => {
    const onSelecionar = vi.fn();
    render(<Nav itens={itens} ativa="inicio" onSelecionar={onSelecionar} />);
    fireEvent.click(screen.getByRole("button", { name: "Premiação" }));
    expect(onSelecionar).toHaveBeenCalledWith("premiacao");
  });

  it("renderiza um item de navegação por entrada da lista", () => {
    render(<Nav itens={itens} ativa="inicio" onSelecionar={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
