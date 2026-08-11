import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("aplica a classe do variant informado", () => {
    render(<Button variant="dourado">Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveClass("botao", "botao-dourado");
  });

  it("usa 'primario' como variant padrão", () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole("button", { name: "Confirmar" })).toHaveClass("botao-primario");
  });

  it("aplica botao-largo quando largo=true", () => {
    render(<Button largo>Entrar</Button>);
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveClass("botao-largo");
  });

  it("dispara onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clicar</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Clicar" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("respeita o atributo disabled", () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole("button", { name: "Bloqueado" })).toBeDisabled();
  });

  it("carregando desabilita o botão, marca aria-busy e mostra o spinner", () => {
    const { container } = render(<Button carregando>Salvar</Button>);
    const botao = screen.getByRole("button", { name: "Salvar" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector(".spinner-botao")).toBeInTheDocument();
  });

  it("sem carregando não mostra o spinner nem aria-busy", () => {
    const { container } = render(<Button>Salvar</Button>);
    expect(container.querySelector(".spinner-botao")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).not.toHaveAttribute("aria-busy");
  });
});
