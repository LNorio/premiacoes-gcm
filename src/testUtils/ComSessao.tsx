import type { ReactNode } from "react";
import { useSessao } from "../state/SessaoContext";

/** Helper de teste: loga com as credenciais informadas e só então renderiza os filhos. */
export function ComSessao({ usuario, senha, children }: { usuario: string; senha: string; children: ReactNode }) {
  const { sessao, entrar } = useSessao();
  if (!sessao) {
    void entrar(usuario, senha);
    return null;
  }
  return <>{children}</>;
}
