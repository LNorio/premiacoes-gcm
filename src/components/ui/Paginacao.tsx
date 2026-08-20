import "./Paginacao.css";

interface PaginacaoProps {
  paginaAtual: number;
  totalPaginas: number;
  tamanhoPagina: number;
  totalItens: number;
  onIrParaPagina: (pagina: number) => void;
  onMudarTamanho: (tamanho: number) => void;
}

const TAMANHOS_DISPONIVEIS = [10, 50, 100];

/** Janela de páginas clicáveis: sempre a 1ª e a última, mais uma vizinhança da atual, com "…" entre lacunas. */
function calcularPaginasVisiveis(atual: number, total: number): (number | "...")[] {
  const DELTA = 1;
  const paginas: (number | "...")[] = [1];
  const min = Math.max(2, atual - DELTA);
  const max = Math.min(total - 1, atual + DELTA);

  if (min > 2) paginas.push("...");
  for (let pagina = min; pagina <= max; pagina++) paginas.push(pagina);
  if (max < total - 1) paginas.push("...");
  if (total > 1) paginas.push(total);

  return paginas;
}

/** Paginação com seletor de linhas por página (10/50/100), avançar/voltar e botões de página clicáveis. */
export function Paginacao({ paginaAtual, totalPaginas, tamanhoPagina, totalItens, onIrParaPagina, onMudarTamanho }: PaginacaoProps) {
  if (totalItens === 0) return null;

  const inicio = (paginaAtual - 1) * tamanhoPagina + 1;
  const fim = Math.min(paginaAtual * tamanhoPagina, totalItens);
  const paginasVisiveis = calcularPaginasVisiveis(paginaAtual, totalPaginas);

  return (
    <div className="paginacao">
      <div className="paginacao-tamanho">
        <label htmlFor="paginacao-tamanho">Linhas por página</label>
        <select id="paginacao-tamanho" value={tamanhoPagina} onChange={(e) => onMudarTamanho(Number(e.target.value))}>
          {TAMANHOS_DISPONIVEIS.map((tamanho) => (
            <option key={tamanho} value={tamanho}>
              {tamanho}
            </option>
          ))}
        </select>
      </div>

      <span className="paginacao-info">
        {inicio}–{fim} de {totalItens}
      </span>

      <nav className="paginacao-paginas" aria-label="Paginação">
        <button
          type="button"
          className="paginacao-botao"
          aria-label="Página anterior"
          disabled={paginaAtual === 1}
          onClick={() => onIrParaPagina(paginaAtual - 1)}
        >
          ‹
        </button>
        {paginasVisiveis.map((pagina, indice) =>
          pagina === "..." ? (
            <span key={`reticencias-${indice}`} className="paginacao-reticencias">
              …
            </span>
          ) : (
            <button
              key={pagina}
              type="button"
              className="paginacao-botao"
              aria-label={`Página ${pagina}`}
              aria-current={pagina === paginaAtual ? "page" : undefined}
              data-ativa={pagina === paginaAtual}
              onClick={() => onIrParaPagina(pagina)}
            >
              {pagina}
            </button>
          ),
        )}
        <button
          type="button"
          className="paginacao-botao"
          aria-label="Próxima página"
          disabled={paginaAtual === totalPaginas}
          onClick={() => onIrParaPagina(paginaAtual + 1)}
        >
          ›
        </button>
      </nav>
    </div>
  );
}
