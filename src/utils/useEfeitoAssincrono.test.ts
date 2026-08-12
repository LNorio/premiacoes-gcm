import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEfeitoAssincrono } from "./useEfeitoAssincrono";

describe("useEfeitoAssincrono", () => {
  it("foiCancelado() é falso enquanto o efeito segue montado com as mesmas deps", () => {
    const foiCanceladoValores: boolean[] = [];
    renderHook(() => {
      useEfeitoAssincrono((foiCancelado) => {
        foiCanceladoValores.push(foiCancelado());
      }, [1]);
    });
    expect(foiCanceladoValores).toEqual([false]);
  });

  it("foiCancelado() vira true depois que as deps mudam (efeito anterior desmontado)", () => {
    const capturas: Array<() => boolean> = [];
    const { rerender } = renderHook(({ dep }) => {
      useEfeitoAssincrono((foiCancelado) => {
        capturas.push(foiCancelado);
      }, [dep]);
    }, { initialProps: { dep: 1 } });

    expect(capturas[0]()).toBe(false);

    rerender({ dep: 2 });

    // a closure capturada pela primeira execução do efeito passa a indicar cancelado
    expect(capturas[0]()).toBe(true);
    // a nova execução (deps atuais) continua não-cancelada
    expect(capturas[1]()).toBe(false);
  });

  it("foiCancelado() vira true quando o componente desmonta", () => {
    const capturas: Array<() => boolean> = [];
    const { unmount } = renderHook(() => {
      useEfeitoAssincrono((foiCancelado) => {
        capturas.push(foiCancelado);
      }, []);
    });

    expect(capturas[0]()).toBe(false);
    unmount();
    expect(capturas[0]()).toBe(true);
  });

  it("um exemplo típico: resposta antiga chega depois da nova e é ignorada", async () => {
    const setState = vi.fn();
    let resolverAntiga!: (valor: string) => void;
    const respostaAntiga = new Promise<string>((resolve) => {
      resolverAntiga = resolve;
    });

    const { rerender } = renderHook(({ dep }) => {
      useEfeitoAssincrono((foiCancelado) => {
        (dep === 1 ? respostaAntiga : Promise.resolve("nova")).then((valor) => {
          if (foiCancelado()) return;
          setState(valor);
        });
      }, [dep]);
    }, { initialProps: { dep: 1 } });

    rerender({ dep: 2 }); // dispara a "nova" busca antes da antiga resolver
    await vi.waitFor(() => expect(setState).toHaveBeenCalledWith("nova"));

    resolverAntiga("antiga"); // resolve tarde — deve ser ignorada
    await new Promise((r) => setTimeout(r, 0));

    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).not.toHaveBeenCalledWith("antiga");
  });
});
