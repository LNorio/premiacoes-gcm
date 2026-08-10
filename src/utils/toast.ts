import { useSyncExternalStore } from "react";

export type ToastVariante = "info" | "sucesso" | "erro";

export interface ToastItem {
  id: number;
  mensagem: string;
  variante: ToastVariante;
}

const DURACAO_PADRAO_MS = 3200;

let proximoId = 1;
let itens: ToastItem[] = [];
const listeners = new Set<() => void>();

function notificar() {
  for (const listener of listeners) listener();
}

/** Enfileira um toast; qualquer camada (serviço, adapter, view) pode chamar. */
export function mostrarToast(mensagem: string, variante: ToastVariante = "info", duracaoMs = DURACAO_PADRAO_MS) {
  const id = proximoId++;
  itens = [...itens, { id, mensagem, variante }];
  notificar();
  setTimeout(() => {
    itens = itens.filter((item) => item.id !== id);
    notificar();
  }, duracaoMs);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return itens;
}

/** Consumido pelo ToastHost para renderizar a fila atual de toasts. */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}
