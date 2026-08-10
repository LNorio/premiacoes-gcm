import { forwardRef, type ReactNode } from "react";
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
 * consome este componente, não deste componente base. O `ref` aponta para
 * o contêiner `.cabecalho-fixo`, para quem consome medir a altura real e
 * compensar com padding-top no conteúdo (position:fixed tira o cabeçalho
 * do fluxo normal do documento).
 */
export const Header = forwardRef<HTMLDivElement, HeaderProps>(function Header(
  { logo, filialSlot, usuarioSlot, children },
  ref,
) {
  return (
    <div className="cabecalho-fixo" ref={ref}>
      <header className="cabecalho">
        {logo}
        {filialSlot ? <div className="cabecalho-filial">{filialSlot}</div> : null}
        {usuarioSlot ? <div className="cabecalho-usuario">{usuarioSlot}</div> : null}
      </header>
      {children}
    </div>
  );
});
