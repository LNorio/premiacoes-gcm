import { useSyncExternalStore } from "react";

let contagem = 0;
const listeners = new Set<() => void>();

function notificar() {
  for (const listener of listeners) listener();
}

/** Chamados pelo `HttpClient` a cada requisição — nenhuma tela usa isso diretamente. */
export function iniciarRequisicaoHttp(): void {
  contagem += 1;
  notificar();
}
export function finalizarRequisicaoHttp(): void {
  contagem = Math.max(0, contagem - 1);
  notificar();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return contagem > 0;
}

/** true enquanto pelo menos uma chamada à API está em andamento — usado pela barra de carregamento global. */
export function useCarregandoHttp(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
