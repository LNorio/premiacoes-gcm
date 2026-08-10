import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  it("não aplica classe de variante para 'info'", () => {
    render(<Toast mensagem="Salvo" />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("toast");
    expect(toast).not.toHaveClass("toast-sucesso", "toast-erro");
    expect(toast).toHaveTextContent("Salvo");
  });

  it("aplica toast-sucesso", () => {
    render(<Toast mensagem="Registro salvo com sucesso" variante="sucesso" />);
    expect(screen.getByRole("status")).toHaveClass("toast-sucesso");
  });

  it("aplica toast-erro", () => {
    render(<Toast mensagem="Falha ao salvar" variante="erro" />);
    expect(screen.getByRole("status")).toHaveClass("toast-erro");
  });
});
