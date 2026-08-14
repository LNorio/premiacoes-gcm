import { useState } from "react";
import { Button } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { CadastroPeriodoPlano } from "./CadastroPeriodoPlano";
import { CadastroTitulares } from "./CadastroTitulares";
import { LancamentoPlanoSaude } from "./LancamentoPlanoSaude";

type SubAba = "cadastro" | "lancamento" | "periodo";

export function PlanoSaude() {
  const { sessao } = useSessao();
  const [subaba, setSubaba] = useState<SubAba>("cadastro");
  const ehAdmin = sessao?.role === "admin";

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Desconto Plano de Saúde</h2>
        <span className="view-subtitulo">Titulares vindos do cadastro de Vendedores — adicione os dependentes de cada um</span>
      </div>

      <div className="acoes-tabela" style={{ justifyContent: "flex-start", marginBottom: "var(--esp-4)" }}>
        <Button variant={subaba === "cadastro" ? "dourado" : "secundario"} onClick={() => setSubaba("cadastro")}>
          Titulares e Dependentes
        </Button>
        <Button variant={subaba === "lancamento" ? "dourado" : "secundario"} onClick={() => setSubaba("lancamento")}>
          Lançamento
        </Button>
        {ehAdmin ? (
          <Button variant={subaba === "periodo" ? "dourado" : "secundario"} onClick={() => setSubaba("periodo")}>
            Período do Plano
          </Button>
        ) : null}
      </div>

      {subaba === "cadastro" ? (
        <CadastroTitulares />
      ) : subaba === "lancamento" ? (
        <LancamentoPlanoSaude />
      ) : ehAdmin ? (
        <CadastroPeriodoPlano />
      ) : null}
    </section>
  );
}
