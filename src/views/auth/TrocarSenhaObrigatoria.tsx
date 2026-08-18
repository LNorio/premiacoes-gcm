import { useState, type FormEvent } from "react";
import logoComercialMariano from "../../assets/logo-comercial-mariano.png";
import { Button, FloatingField, IconeOlho, MensagemErro } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { mostrarToast } from "../../utils/toast";
import "./Login.css";

export function TrocarSenhaObrigatoria() {
  const { trocarSenha } = useSessao();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function tratarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!senhaAtual || !novaSenha || !confirmacao) {
      setErro("Preencha a senha atual e a nova senha nos dois campos.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await trocarSenha(senhaAtual, novaSenha);
      if (resultado.status !== "sucesso") {
        setErro(resultado.status === "erro" ? resultado.mensagem : "Falha ao trocar a senha.");
        return;
      }
      mostrarToast("Senha alterada com sucesso. Entre novamente com a nova senha.", "sucesso");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="tela-login">
      <div className="login-cartao">
        <img src={logoComercialMariano} alt="Comercial Mariano" className="login-logo" />
        <h1 className="login-titulo">Troque sua senha</h1>
        <p className="login-dica" style={{ marginTop: 0, marginBottom: "var(--esp-5)" }}>
          Este é um acesso novo ou sua senha foi redefinida pelo Administrador — defina uma senha nova antes de continuar.
        </p>

        <form onSubmit={tratarSubmit}>
          {erro ? <MensagemErro mensagem={erro} /> : null}

          <FloatingField
            id="trocar-senha-atual"
            label="Senha atual"
            type={senhaVisivel ? "text" : "password"}
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoComplete="current-password"
            required
            icon={
              <button
                type="button"
                className="botao-alternar-senha"
                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setSenhaVisivel((v) => !v)}
              >
                <IconeOlho aberto={senhaVisivel} />
              </button>
            }
          />
          <FloatingField
            id="trocar-senha-nova"
            label="Nova senha"
            type={senhaVisivel ? "text" : "password"}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
            required
          />
          <FloatingField
            id="trocar-senha-confirmacao"
            label="Confirmar nova senha"
            type={senhaVisivel ? "text" : "password"}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="new-password"
            required
          />

          <div className="login-acoes">
            <Button type="submit" variant="dourado" className="login-botao-entrar" carregando={salvando}>
              {salvando ? "Salvando..." : "Salvar senha"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
