import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./AjudaPopover.css";

/** Distância mínima que o painel deve manter das bordas da janela ao ser reposicionado. */
const MARGEM_JANELA = 8;

interface AjudaPopoverProps {
  texto: string;
  rotuloBotao?: string;
}

/** Ícone "?" que abre um painel de texto explicativo — mesmo esquema de posicionamento/portal do `MenuAcoes`. */
export function AjudaPopover({ texto, rotuloBotao = "Ajuda" }: AjudaPopoverProps) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 0, right: 0 });
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const rect = botaoRef.current?.getBoundingClientRect();
    if (rect) setPosicao({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setAberto(true);
  }

  useLayoutEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    const botao = botaoRef.current;
    if (!painel || !botao) return;

    const painelRect = painel.getBoundingClientRect();
    const botaoRect = botao.getBoundingClientRect();
    let { top, right } = posicao;
    let precisaAjustar = false;

    if (painelRect.bottom > window.innerHeight - MARGEM_JANELA) {
      top = Math.max(MARGEM_JANELA, botaoRect.top - painelRect.height - 4);
      precisaAjustar = true;
    }
    if (painelRect.left < MARGEM_JANELA) {
      right = Math.max(0, window.innerWidth - MARGEM_JANELA - painelRect.width);
      precisaAjustar = true;
    }
    if (precisaAjustar) setPosicao({ top, right });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function fechar() {
      setAberto(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fechar();
    }
    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (botaoRef.current?.contains(alvo) || painelRef.current?.contains(alvo)) return;
      fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        ref={botaoRef}
        className="ajuda-popover-botao"
        aria-label={rotuloBotao}
        aria-expanded={aberto}
        onClick={() => (aberto ? setAberto(false) : abrir())}
      >
        ?
      </button>
      {aberto
        ? createPortal(
            <div
              ref={painelRef}
              className="ajuda-popover-painel"
              role="tooltip"
              style={{ top: posicao.top, right: posicao.right }}
            >
              {texto}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
