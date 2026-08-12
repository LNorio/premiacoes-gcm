import { useEffect, type DependencyList } from "react";

/**
 * Como `useEffect`, mas a função recebe um `foiCancelado()` que passa a
 * retornar `true` assim que o efeito for desmontado ou re-executado (deps
 * mudaram). Sem isso, uma resposta de rede que demore mais que a próxima
 * (ex.: usuário troca o filtro de mês duas vezes rápido, ou o StrictMode do
 * React remonta o efeito em desenvolvimento) pode sobrescrever um estado mais
 * novo com dados desatualizados — quem usa este hook deve checar
 * `foiCancelado()` antes de cada `setState` que vem depois de um `await`.
 */
export function useEfeitoAssincrono(efeito: (foiCancelado: () => boolean) => void, deps: DependencyList): void {
  useEffect(() => {
    let cancelado = false;
    efeito(() => cancelado);
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
