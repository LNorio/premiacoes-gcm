import type { ReactNode } from "react";
import "./Nav.css";

export interface NavItemData {
  chave: string;
  rotulo: string;
  icone?: ReactNode;
}

interface NavProps {
  itens: NavItemData[];
  ativa: string;
  onSelecionar: (chave: string) => void;
}

/**
 * Navegação por abas (F2.SHELL-02). Recebe os itens já filtrados por
 * NAV_POR_PAPEL — este componente não conhece perfis/permissões.
 */
export function Nav({ itens, ativa, onSelecionar }: NavProps) {
  return (
    <nav className="navegacao">
      {itens.map((item) => (
        <button
          key={item.chave}
          type="button"
          className={item.chave === ativa ? "nav-item ativo" : "nav-item"}
          aria-current={item.chave === ativa ? "page" : undefined}
          onClick={() => onSelecionar(item.chave)}
        >
          {item.icone}
          {item.rotulo}
        </button>
      ))}
    </nav>
  );
}
