import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BadgeInfo, Button, Header, Nav, type NavItemData } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import type { Tela } from "../../types";
import { FILIAL_TODAS } from "../../types";
import { FILIAIS, NAV_POR_PAPEL, ROTULOS_TELAS } from "../../utils/constantes";
import { rotuloFilial } from "../../utils/filial";
import { Comissao } from "../comissao/Comissao";
import { ConsolidadoPev } from "../consolidadoPev/ConsolidadoPev";
import { ConsultaPeriodo } from "../consulta/ConsultaPeriodo";
import { Descontos } from "../descontos/Descontos";
import { Inicio } from "../inicio/Inicio";
import { Premiacao } from "../premiacao/Premiacao";
import { CadastroColaboradores } from "../vendedores/CadastroColaboradores";
import { EmConstrucao } from "./EmConstrucao";

function IconeInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

/** Renderiza a view ativa. Telas fora do WBS ainda implementado caem em EmConstrucao (F5 em diante). */
function renderizarView(view: Tela, aoNavegar: (tela: Tela) => void) {
  switch (view) {
    case "inicio":
      return <Inicio aoNavegar={aoNavegar} />;
    case "vendedores":
      return <CadastroColaboradores />;
    case "premiacao":
      return <Premiacao />;
    case "consolidado-pev":
      return <ConsolidadoPev />;
    case "consulta":
      return <ConsultaPeriodo />;
    case "comissao":
      return <Comissao />;
    case "descontos":
      return <Descontos />;
    default:
      return <EmConstrucao titulo={ROTULOS_TELAS[view]} />;
  }
}

export function Shell() {
  const { sessao, sair, definirFilialAtiva } = useSessao();
  const [viewAtiva, setViewAtiva] = useState<Tela>("inicio");
  const cabecalhoRef = useRef<HTMLDivElement>(null);
  const conteudoRef = useRef<HTMLElement>(null);
  const role = sessao?.role;
  const itensPermitidos = useMemo(() => (role ? NAV_POR_PAPEL[role] : []), [role]);

  // Guarda de rota (F2.SHELL-04): mesma regra do protótipo — mostrarView() cai em 'inicio'
  // quando a view pedida não está em NAV_POR_PAPEL do perfil.
  useEffect(() => {
    if (!itensPermitidos.includes(viewAtiva)) {
      setViewAtiva("inicio");
    }
  }, [itensPermitidos, viewAtiva]);

  // "Ajuste de espaço" (F2.SHELL-01): o cabeçalho é position:fixed, então mede a altura
  // real dele e aplica como padding-top no conteúdo, para nada ficar escondido atrás.
  useLayoutEffect(() => {
    const fixo = cabecalhoRef.current;
    const conteudo = conteudoRef.current;
    if (!fixo || !conteudo) return;

    const ajustar = () => {
      conteudo.style.paddingTop = `${fixo.offsetHeight}px`;
    };
    ajustar();

    const observer = new ResizeObserver(ajustar);
    observer.observe(fixo);
    return () => observer.disconnect();
  }, []);

  if (!sessao) return null; // Shell só é montado com sessão ativa — ver App.tsx

  const itens: NavItemData[] = itensPermitidos.map((chave) => ({ chave, rotulo: ROTULOS_TELAS[chave] }));

  return (
    <div className="app">
      <Header
        ref={cabecalhoRef}
        filialSlot={
          <>
            <button
              type="button"
              className="botao botao-cabecalho-inicio"
              onClick={() => setViewAtiva("inicio")}
              title="Ir para o Início"
            >
              <IconeInicio />
              <span>Início</span>
            </button>
            {sessao.role === "admin" ? (
              <select
                aria-label="Filial"
                value={sessao.filialAtiva}
                onChange={(e) => definirFilialAtiva(e.target.value)}
              >
                <option value={FILIAL_TODAS}>Todas as filiais</option>
                {FILIAIS.map((filial) => (
                  <option key={filial} value={filial}>
                    Filial {filial}
                  </option>
                ))}
              </select>
            ) : (
              <BadgeInfo>{rotuloFilial(sessao.filialAtiva)}</BadgeInfo>
            )}
          </>
        }
        usuarioSlot={
          <>
            <span>Olá, {sessao.nome}</span>
            <BadgeInfo perfil>{sessao.role}</BadgeInfo>
            <Button variant="texto" onClick={sair}>
              Sair
            </Button>
          </>
        }
      >
        <Nav itens={itens} ativa={viewAtiva} onSelecionar={(chave) => setViewAtiva(chave as Tela)} />
      </Header>

      <main className="conteudo" ref={conteudoRef}>
        {renderizarView(viewAtiva, setViewAtiva)}
      </main>
    </div>
  );
}
