import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { colaboradoresService } from "../../adapters";
import { SessaoProvider, useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS } from "../../types";
import { TrocarSenhaObrigatoria } from "./TrocarSenhaObrigatoria";

beforeEach(() => {
  localStorage.clear();
});

/** Loga uma única vez (sem retentar depois de um logout, diferente do ComSessao) e mostra a tela certa conforme a sessão. */
function Cenario() {
  const { sessao, entrar } = useSessao();
  const [tentou, setTentou] = useState(false);

  useEffect(() => {
    if (!sessao && !tentou) {
      setTentou(true);
      void entrar("carlos.silva", "venda123");
    }
  }, [sessao, tentou, entrar]);

  if (!sessao) return tentou ? <p>Voltou para a tela de login</p> : null;
  if (sessao.precisaTrocarSenha) return <TrocarSenhaObrigatoria />;
  return <p>Shell (sem pendência de troca de senha)</p>;
}

async function marcarPrecisaTrocarSenha() {
  const resultado = await colaboradoresService.listarColaboradores(FILIAL_TODAS);
  if (resultado.status !== "sucesso") throw new Error("seed não carregou");
  const carlos = resultado.dados.find((c) => c.usuarioAcesso === "carlos.silva")!;
  await colaboradoresService.salvarColaborador({ ...carlos, precisaTrocarSenha: true });
}

describe("TrocarSenhaObrigatoria", () => {
  it("aparece no lugar do Shell quando a sessão tem 'precisaTrocarSenha'", async () => {
    await marcarPrecisaTrocarSenha();
    render(
      <SessaoProvider>
        <Cenario />
      </SessaoProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Troque sua senha" })).toBeInTheDocument();
    expect(screen.queryByText("Shell (sem pendência de troca de senha)")).not.toBeInTheDocument();
  });

  it("valida que as duas senhas preenchidas sejam iguais antes de salvar", async () => {
    await marcarPrecisaTrocarSenha();
    const user = userEvent.setup();
    render(
      <SessaoProvider>
        <Cenario />
      </SessaoProvider>,
    );
    await screen.findByRole("heading", { name: "Troque sua senha" });

    await user.type(screen.getByLabelText("Senha atual"), "venda123");
    await user.type(screen.getByLabelText("Nova senha"), "senhaNova1");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senhaDiferente");
    await user.click(screen.getByRole("button", { name: "Salvar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("As senhas não são iguais.");
    // continua na tela de troca de senha, não voltou pro login
    expect(screen.getByRole("heading", { name: "Troque sua senha" })).toBeInTheDocument();
  });

  it("rejeita quando a senha atual está incorreta", async () => {
    await marcarPrecisaTrocarSenha();
    const user = userEvent.setup();
    render(
      <SessaoProvider>
        <Cenario />
      </SessaoProvider>,
    );
    await screen.findByRole("heading", { name: "Troque sua senha" });

    await user.type(screen.getByLabelText("Senha atual"), "senha-errada");
    await user.type(screen.getByLabelText("Nova senha"), "senhaNova123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senhaNova123");
    await user.click(screen.getByRole("button", { name: "Salvar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Senha atual incorreta.");
    expect(screen.getByRole("heading", { name: "Troque sua senha" })).toBeInTheDocument();
  });

  it("salva a nova senha e volta pra tela de login", async () => {
    await marcarPrecisaTrocarSenha();
    const user = userEvent.setup();
    render(
      <SessaoProvider>
        <Cenario />
      </SessaoProvider>,
    );
    await screen.findByRole("heading", { name: "Troque sua senha" });

    await user.type(screen.getByLabelText("Senha atual"), "venda123");
    await user.type(screen.getByLabelText("Nova senha"), "senhaNova123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senhaNova123");
    await user.click(screen.getByRole("button", { name: "Salvar senha" }));

    expect(await screen.findByText("Voltou para a tela de login")).toBeInTheDocument();

    const resultado = await colaboradoresService.listarColaboradores(FILIAL_TODAS);
    const carlos = resultado.status === "sucesso" && resultado.dados.find((c) => c.usuarioAcesso === "carlos.silva");
    expect(carlos && carlos.senhaAcesso).toBe("senhaNova123");
    expect(carlos && carlos.precisaTrocarSenha).toBe(false);
  });

  it("a senha começa oculta e o botão de mostrar/ocultar alterna os dois campos juntos", async () => {
    await marcarPrecisaTrocarSenha();
    const user = userEvent.setup();
    render(
      <SessaoProvider>
        <Cenario />
      </SessaoProvider>,
    );
    await screen.findByRole("heading", { name: "Troque sua senha" });

    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "text");
  });
});
