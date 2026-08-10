import type { ReactNode } from "react";
import "./Header.css";

interface HeaderProps {
  logo?: ReactNode;
  filialSlot?: ReactNode;
  usuarioSlot?: ReactNode;
  children?: ReactNode;
}

/**
 * Cabeçalho fixo do app (F2.SHELL-01). Recebe os blocos de filial/usuário
 * como slots — a lógica de sessão/perfil é responsabilidade de quem
 * consome este componente, não deste componente base.
 */
export function Header({ logo, filialSlot, usuarioSlot, children }: HeaderProps) {
  return (
    <div className="cabecalho-fixo">
      <header className="cabecalho">
        {logo}
        {filialSlot ? <div className="cabecalho-filial">{filialSlot}</div> : null}
        {usuarioSlot ? <div className="cabecalho-usuario">{usuarioSlot}</div> : null}
      </header>
      {children}
    </div>
  );
}
