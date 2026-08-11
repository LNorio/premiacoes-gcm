import { useCarregandoHttp } from "../utils/cargaHttp";
import "./BarraCarregamentoGlobal.css";

/** Barra fina no topo da tela, visível enquanto há chamadas à API em andamento; monta uma vez na raiz do app. */
export function BarraCarregamentoGlobal() {
  const carregando = useCarregandoHttp();
  if (!carregando) return null;
  return (
    <div className="barra-carregamento-global" role="status" aria-live="polite" aria-label="Carregando">
      <div className="barra-carregamento-global-preenchimento" />
    </div>
  );
}
