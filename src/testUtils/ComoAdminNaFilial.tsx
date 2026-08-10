import { useEffect, useRef, type ReactNode } from "react";
import { useSessao } from "../state/SessaoContext";

/** Loga como Admin e move a sessão para uma filial específica (sai de FILIAL_TODAS). */
export function ComoAdminNaFilial({ filial, children }: { filial: string; children: ReactNode }) {
  const { sessao, entrar, definirFilialAtiva } = useSessao();
  const jaTrocou = useRef(false);

  useEffect(() => {
    if (!sessao) {
      void entrar("admin", "admin123");
    } else if (!jaTrocou.current) {
      jaTrocou.current = true;
      definirFilialAtiva(filial);
    }
  }, [sessao, entrar, definirFilialAtiva, filial]);

  if (!sessao || sessao.filialAtiva !== filial) return null;
  return <>{children}</>;
}
