import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("não renderiza nada quando aberto=false", () => {
    render(
      <Modal aberto={false} titulo="Título" onFechar={() => {}}>
        Conteúdo
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza título e conteúdo quando aberto=true", () => {
    render(
      <Modal aberto titulo="Adicionar colaborador" onFechar={() => {}}>
        <p>Conteúdo do formulário</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Adicionar colaborador" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo do formulário")).toBeInTheDocument();
  });

  it("chama onFechar ao clicar no botão de fechar", async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        Conteúdo
      </Modal>,
    );
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("chama onFechar ao pressionar Escape", async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        Conteúdo
      </Modal>,
    );
    await user.keyboard("{Escape}");
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("chama onFechar ao clicar fora da caixa (no fundo)", async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    const { container } = render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        Conteúdo
      </Modal>,
    );
    void container;
    await user.click(document.querySelector(".modal-fundo")!);
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("não chama onFechar ao clicar dentro da caixa", async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        Conteúdo
      </Modal>,
    );
    await user.click(screen.getByText("Conteúdo"));
    expect(onFechar).not.toHaveBeenCalled();
  });
});
