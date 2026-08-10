import { MensagemVazia } from "../../components/ui";

/**
 * Placeholder para telas do NAV_POR_PAPEL cujo WBS ainda não foi
 * implementado (F3 em diante). Evita rota quebrada sem antecipar escopo
 * fora de F2.
 */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>{titulo}</h2>
      </div>
      <MensagemVazia mensagem="Esta tela ainda não foi implementada." />
    </section>
  );
}
