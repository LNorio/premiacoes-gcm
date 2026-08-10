/**
 * Persistência do adapter mock (F1-03): tudo em localStorage, para
 * sobreviver ao reload. Nenhuma tela toca isto diretamente — só os
 * adapters em src/adapters/mock/*.
 */
const PREFIXO = "premiacoes-gcm::";

export function lerColecao<T>(chave: string): T[] {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T[]) : [];
  } catch {
    return [];
  }
}

export function gravarColecao<T>(chave: string, itens: T[]): void {
  localStorage.setItem(PREFIXO + chave, JSON.stringify(itens));
}

export function lerValor<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

export function gravarValor<T>(chave: string, valor: T): void {
  localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
}

let contador = 0;
export function gerarId(prefixoEntidade: string): string {
  contador += 1;
  return `${prefixoEntidade}-${Date.now()}-${contador}`;
}

/** Upsert por id em uma coleção; gera id novo quando `id` vem vazio. */
export function upsertPorId<T extends { id: string }>(chave: string, item: T, prefixoEntidade: string): T {
  const colecao = lerColecao<T>(chave);
  const itemComId = item.id ? item : { ...item, id: gerarId(prefixoEntidade) };
  const indice = colecao.findIndex((existente) => existente.id === itemComId.id);
  if (indice === -1) {
    gravarColecao(chave, [...colecao, itemComId]);
  } else {
    const copia = [...colecao];
    copia[indice] = itemComId;
    gravarColecao(chave, copia);
  }
  return itemComId;
}

export function removerPorId(chave: string, id: string): void {
  gravarColecao(
    chave,
    lerColecao<{ id: string }>(chave).filter((item) => item.id !== id),
  );
}
