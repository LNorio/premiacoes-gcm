import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./MenuAcoes.css";

export interface ItemMenuAcoes {
  rotulo: string;
  onSelecionar: () => void;
  variante?: "padrao" | "perigo";
  desabilitado?: boolean;
}

interface MenuAcoesProps {
  itens: ItemMenuAcoes[];
  rotuloBotao?: string;
}

/** Distância mínima que o menu deve manter das bordas da janela ao ser reposicionado. */
const MARGEM_JANELA = 8;

/** Ícone "⋮" que abre um menu de ações — renderizado via portal para não ser cortado pela rolagem horizontal da tabela (`.tabela-wrapper`). */
export function MenuAcoes({ itens, rotuloBotao = "Mais ações" }: MenuAcoesProps) {
  const [aberto, setAberto] = useState(false);
  // `right`/`top` fixos em vez de `left` + `transform: translateX(-100%)`: a animação de entrada
  // (`surgir`, ver global.css) anima `transform`, o que sobrescrevia o translateX inline assim que
  // terminava — o menu "pulava" pra direita do ícone. `right` não conflita com a animação.
  const [posicao, setPosicao] = useState({ top: 0, right: 0 });
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const rect = botaoRef.current?.getBoundingClientRect();
    if (rect) setPosicao({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setAberto(true);
  }

  // Depois do menu montar na posição "ideal" (colado no botão), mede o tamanho real e corrige se
  // estourar a borda inferior (abre pra cima do botão) ou a borda esquerda (afasta da borda) da janela.
  useLayoutEffect(() => {
    if (!aberto) return;
    const menu = menuRef.current;
    const botao = botaoRef.current;
    if (!menu || !botao) return;

    const menuRect = menu.getBoundingClientRect();
    const botaoRect = botao.getBoundingClientRect();
    let { top, right } = posicao;
    let precisaAjustar = false;

    if (menuRect.bottom > window.innerHeight - MARGEM_JANELA) {
      top = Math.max(MARGEM_JANELA, botaoRect.top - menuRect.height - 4);
      precisaAjustar = true;
    }
    if (menuRect.left < MARGEM_JANELA) {
      right = Math.max(0, window.innerWidth - MARGEM_JANELA - menuRect.width);
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
      if (botaoRef.current?.contains(alvo) || menuRef.current?.contains(alvo)) return;
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
        className="menu-acoes-botao"
        aria-label={rotuloBotao}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => (aberto ? setAberto(false) : abrir())}
      >
        ⋮
      </button>
      {aberto
        ? createPortal(
            <div
              ref={menuRef}
              className="menu-acoes-lista"
              role="menu"
              style={{ top: posicao.top, right: posicao.right }}
            >
              {itens.map((item) => (
                <button
                  key={item.rotulo}
                  type="button"
                  role="menuitem"
                  className={["menu-acoes-item", item.variante === "perigo" && "menu-acoes-item-perigo"].filter(Boolean).join(" ")}
                  disabled={item.desabilitado}
                  onClick={() => {
                    setAberto(false);
                    item.onSelecionar();
                  }}
                >
                  {item.rotulo}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
