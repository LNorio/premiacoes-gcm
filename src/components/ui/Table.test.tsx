import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinhaVazia, Table } from "./Table";

describe("Table", () => {
  it("renderiza uma table dentro do tabela-wrapper", () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>Linha</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(container.querySelector(".tabela-wrapper > table")).toHaveClass("tabela");
    expect(container.querySelector(".tabela-wrapper > table")).not.toHaveClass("tabela-planilha");
  });

  it("aplica tabela-planilha quando planilha=true", () => {
    const { container } = render(
      <Table planilha>
        <tbody />
      </Table>,
    );
    expect(container.querySelector("table")).toHaveClass("tabela", "tabela-planilha");
  });
});

describe("LinhaVazia", () => {
  it("renderiza a mensagem com o colSpan informado", () => {
    render(
      <table>
        <tbody>
          <LinhaVazia colSpan={3} mensagem="Nenhum registro encontrado" />
        </tbody>
      </table>,
    );
    const celula = screen.getByText("Nenhum registro encontrado");
    expect(celula).toHaveAttribute("colspan", "3");
  });
});
