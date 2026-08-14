import { useState } from "react";
import { Button } from "../../components/ui";
import { CadastroTitulares } from "./CadastroTitulares";
import { LancamentoPlanoSaude } from "./LancamentoPlanoSaude";

type SubAba = "cadastro" | "lancamento";

export function PlanoSaude() {
  const [subaba, setSubaba] = useState<SubAba>("cadastro");

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
      </div>

      {subaba === "cadastro" ? <CadastroTitulares /> : <LancamentoPlanoSaude />}
    </section>
  );
}
