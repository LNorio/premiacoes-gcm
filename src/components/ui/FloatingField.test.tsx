import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FloatingField } from "./FloatingField";

describe("FloatingField", () => {
  it("associa o label ao input via htmlFor/id", () => {
    render(<FloatingField id="usuario" label="Usuário" />);
    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
  });

  it("não aplica com-icone quando não há ícone", () => {
    const { container } = render(<FloatingField id="usuario" label="Usuário" />);
    expect(container.querySelector(".campo-flutuante")).not.toHaveClass("com-icone");
  });

  it("aplica com-icone e renderiza o ícone quando fornecido", () => {
    render(<FloatingField id="senha" label="Senha" icon={<button aria-label="mostrar senha" />} />);
    expect(screen.getByRole("button", { name: "mostrar senha" })).toBeInTheDocument();
  });

  it("repassa eventos de mudança para o input", () => {
    const onChange = vi.fn();
    render(<FloatingField id="usuario" label="Usuário" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "admin" } });
    expect(onChange).toHaveBeenCalledOnce();
  });
});
