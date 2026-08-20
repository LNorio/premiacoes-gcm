import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePaginacao } from "./usePaginacao";

function itensDe(quantidade: number): number[] {
  return Array.from({ length: quantidade }, (_, i) => i + 1);
}

describe("usePaginacao", () => {
  it("com menos itens que o tamanho da página, mostra tudo numa página só", () => {
    const { result } = renderHook(() => usePaginacao(itensDe(5), 10));
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.paginaAtual).toBe(1);
    expect(result.current.itensDaPagina).toEqual([1, 2, 3, 4, 5]);
  });

  it("divide os itens em páginas do tamanho configurado", () => {
    const { result } = renderHook(() => usePaginacao(itensDe(25), 10));
    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.itensDaPagina).toEqual(itensDe(10));

    act(() => result.current.irParaPagina(3));
    expect(result.current.itensDaPagina).toEqual([21, 22, 23, 24, 25]);
  });

  it("trocar o tamanho da página volta pra página 1", () => {
    const { result } = renderHook(() => usePaginacao(itensDe(25), 10));
    act(() => result.current.irParaPagina(3));
    expect(result.current.paginaAtual).toBe(3);

    act(() => result.current.definirTamanhoPagina(50));
    expect(result.current.paginaAtual).toBe(1);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.itensDaPagina).toEqual(itensDe(25));
  });

  it("quando a lista de itens encolhe (ex.: busca) e a página atual deixa de existir, volta pra página 1", () => {
    const { result, rerender } = renderHook(({ itens }) => usePaginacao(itens, 10), {
      initialProps: { itens: itensDe(25) },
    });
    act(() => result.current.irParaPagina(3));
    expect(result.current.paginaAtual).toBe(3);

    rerender({ itens: itensDe(2) });
    expect(result.current.paginaAtual).toBe(1);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.itensDaPagina).toEqual([1, 2]);
  });

  it("nunca deixa totalPaginas menor que 1, mesmo sem itens", () => {
    const { result } = renderHook(() => usePaginacao([], 10));
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.itensDaPagina).toEqual([]);
  });
});
