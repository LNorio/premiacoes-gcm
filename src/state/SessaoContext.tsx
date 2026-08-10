import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { authService } from "../adapters";
import type { Sessao } from "../types";

interface SessaoContextValor {
  sessao: Sessao | null;
  entrando: boolean;
  erro: string | null;
  entrar: (usuario: string, senha: string) => Promise<void>;
  sair: () => void;
  definirFilialAtiva: (filial: string) => void;
}

const SessaoContext = createContext<SessaoContextValor | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = useCallback(async (usuario: string, senha: string) => {
    setEntrando(true);
    setErro(null);
    const resultado = await authService.login(usuario, senha);
    setEntrando(false);
    if (resultado.status === "sucesso") {
      setSessao(resultado.dados);
    } else if (resultado.status === "erro") {
      setErro(resultado.mensagem);
    }
  }, []);

  const sair = useCallback(() => {
    void authService.logout();
    setSessao(null);
    setErro(null);
  }, []);

  const definirFilialAtiva = useCallback((filial: string) => {
    setSessao((atual) => (atual ? { ...atual, filialAtiva: filial } : atual));
  }, []);

  const valor = useMemo(
    () => ({ sessao, entrando, erro, entrar, sair, definirFilialAtiva }),
    [sessao, entrando, erro, entrar, sair, definirFilialAtiva],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao(): SessaoContextValor {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  return contexto;
}
