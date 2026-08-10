import "./Estado.css";

/** Estados padronizados de carregamento (F2.UI-01) — usados em toda tela que consome um Resultado<T>. */
export function Carregando({ mensagem = "Carregando..." }: { mensagem?: string }) {
  return (
    <p className="estado-carregando" role="status">
      {mensagem}
    </p>
  );
}

export function MensagemVazia({ mensagem }: { mensagem: string }) {
  return <p className="estado-vazio">{mensagem}</p>;
}

export function MensagemErro({ mensagem }: { mensagem: string }) {
  return (
    <p className="estado-erro" role="alert">
      {mensagem}
    </p>
  );
}
