import { useEffect, useRef, useState } from "react";
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

/** Ícone "⋮" que abre um menu de ações — renderizado via portal para não ser cortado pela rolagem horizontal da tabela (`.tabela-wrapper`). */
export function MenuAcoes({ itens, rotuloBotao = "Mais ações" }: MenuAcoesProps) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const rect = botaoRef.current?.getBoundingClientRect();
    if (rect) setPosicao({ top: rect.bottom + 4, left: rect.right });
    setAberto(true);
  }

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
              style={{ top: posicao.top, left: posicao.left, transform: "translateX(-100%)" }}
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
