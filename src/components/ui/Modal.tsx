import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

interface ModalProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export function Modal({ aberto, titulo, onFechar, children }: ModalProps) {
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="modal-fundo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="modal-caixa" ref={caixaRef} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-cabecalho">
          <h3>{titulo}</h3>
          <button type="button" className="modal-fechar" aria-label="Fechar" onClick={onFechar}>
            ✕
          </button>
        </div>
        <div className="modal-conteudo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
