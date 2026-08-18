import { useState, type FormEvent } from "react";
import logoComercialMariano from "../../assets/logo-comercial-mariano.png";
import { Button, FloatingField, IconeOlho, MensagemErro } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import "./Login.css";

export function Login() {
  const { entrar, entrando, erro } = useSessao();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  function tratarSubmit(evento: FormEvent) {
    evento.preventDefault();
    void entrar(usuario, senha);
  }

  return (
    <div className="tela-login">
      <div className="login-cartao">
        <img src={logoComercialMariano} alt="Comercial Mariano" className="login-logo" />
        <h1 className="login-titulo">Sistema de Premiações</h1>

        <form onSubmit={tratarSubmit}>
          {erro ? <MensagemErro mensagem={erro} /> : null}

          <FloatingField
            id="login-usuario"
            label="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
          />
          <FloatingField
            id="login-senha"
            label="Senha"
            type={senhaVisivel ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
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

          <div className="login-acoes">
            <Button type="submit" variant="dourado" className="login-botao-entrar" carregando={entrando}>
              {entrando ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <p className="login-dica">Use as credenciais fornecidas pela administração.</p>
      </div>
    </div>
  );
}
