import { useState, type FormEvent } from "react";
import { Button, FloatingField, MensagemErro } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import "./Login.css";

function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.5 10.5 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88M1 1l22 22" />
    </svg>
  );
}

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
