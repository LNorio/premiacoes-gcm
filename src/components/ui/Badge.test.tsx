import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BadgeInfo, BadgeTela, Selo } from "./Badge";

describe("BadgeInfo", () => {
  it("renderiza sem a classe badge-perfil por padrão", () => {
    render(<BadgeInfo>Filial 100</BadgeInfo>);
    expect(screen.getByText("Filial 100")).toHaveClass("badge-info");
    expect(screen.getByText("Filial 100")).not.toHaveClass("badge-perfil");
  });

  it("aplica badge-perfil quando perfil=true", () => {
    render(<BadgeInfo perfil>Administrador</BadgeInfo>);
    expect(screen.getByText("Administrador")).toHaveClass("badge-info", "badge-perfil");
  });
});

describe("BadgeTela", () => {
  it("renderiza com a classe badge-tela", () => {
    render(<BadgeTela>Premiação</BadgeTela>);
    expect(screen.getByText("Premiação")).toHaveClass("badge-tela");
  });
});

describe("Selo", () => {
  it("aplica a classe da variante", () => {
    render(<Selo variante="sucesso">Em dia</Selo>);
    expect(screen.getByText("Em dia")).toHaveClass("selo", "selo-sucesso");
  });

  it("aplica selo-alerta para a variante alerta", () => {
    render(<Selo variante="alerta">Pendente</Selo>);
    expect(screen.getByText("Pendente")).toHaveClass("selo-alerta");
  });
});
