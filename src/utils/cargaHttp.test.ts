import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { finalizarRequisicaoHttp, iniciarRequisicaoHttp, useCarregandoHttp } from "./cargaHttp";

describe("cargaHttp", () => {
  it("fica true enquanto há ao menos uma requisição em andamento e volta a false quando todas terminam", () => {
    const { result } = renderHook(() => useCarregandoHttp());
    expect(result.current).toBe(false);

    act(() => iniciarRequisicaoHttp());
    expect(result.current).toBe(true);

    act(() => iniciarRequisicaoHttp()); // uma segunda requisição simultânea
    expect(result.current).toBe(true);

    act(() => finalizarRequisicaoHttp()); // só uma terminou — ainda há uma em andamento
    expect(result.current).toBe(true);

    act(() => finalizarRequisicaoHttp());
    expect(result.current).toBe(false);
  });

  it("não fica negativo se finalizarRequisicaoHttp for chamado a mais", () => {
    const { result } = renderHook(() => useCarregandoHttp());
    act(() => finalizarRequisicaoHttp());
    act(() => iniciarRequisicaoHttp());
    expect(result.current).toBe(true);
  });
});
