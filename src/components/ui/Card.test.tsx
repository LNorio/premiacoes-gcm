import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardGrid } from "./Card";

describe("Card", () => {
  it("renderiza título e conteúdo", () => {
    render(
      <Card titulo="Colaboradores">
        <p>6</p>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Colaboradores" })).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("aplica cartao-destaque quando destaque=true", () => {
    const { container } = render(<Card destaque>Conteúdo</Card>);
    expect(container.querySelector("article")).toHaveClass("cartao", "cartao-destaque");
  });

  it("não aplica cartao-destaque por padrão", () => {
    const { container } = render(<Card>Conteúdo</Card>);
    expect(container.querySelector("article")).not.toHaveClass("cartao-destaque");
  });
});

describe("CardGrid", () => {
  it("envolve os filhos em grade-cartoes", () => {
    const { container } = render(
      <CardGrid>
        <Card>A</Card>
        <Card>B</Card>
      </CardGrid>,
    );
    expect(container.querySelector(".grade-cartoes")?.children).toHaveLength(2);
  });
});
