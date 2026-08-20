import { useEffect, useState } from "react";

export interface ResultadoPaginacao<T> {
  paginaAtual: number;
  totalPaginas: number;
  tamanhoPagina: number;
  totalItens: number;
  itensDaPagina: T[];
  irParaPagina: (pagina: number) => void;
  definirTamanhoPagina: (tamanho: number) => void;
}

const TAMANHO_PADRAO = 10;

/**
 * Pagina um array já filtrado/ordenado. `itens` deve ser a unidade "por página" —
 * ex.: um colaborador (com seus lançamentos/dependentes já agrupados dentro dele),
 * não a lista bruta de `<tr>` renderizados, senão uma família pode ficar cortada
 * entre duas páginas.
 */
export function usePaginacao<T>(itens: T[], tamanhoInicial: number = TAMANHO_PADRAO): ResultadoPaginacao<T> {
  const [tamanhoPagina, setTamanhoPagina] = useState(tamanhoInicial);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalItens = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / tamanhoPagina));

  // Volta pra página 1 sempre que a quantidade de itens muda (nova busca, troca de
  // filial/mês, recarregamento) — evita ficar "presa" numa página que deixou de existir.
  useEffect(() => {
    setPaginaAtual(1);
  }, [totalItens]);

  const paginaEfetiva = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaEfetiva - 1) * tamanhoPagina;
  const itensDaPagina = itens.slice(inicio, inicio + tamanhoPagina);

  return {
    paginaAtual: paginaEfetiva,
    totalPaginas,
    tamanhoPagina,
    totalItens,
    itensDaPagina,
    irParaPagina: setPaginaAtual,
    definirTamanhoPagina: (tamanho) => {
      setTamanhoPagina(tamanho);
      setPaginaAtual(1);
    },
  };
}
