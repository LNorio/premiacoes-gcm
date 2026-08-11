/**
 * Token Sanctum da sessão atual (F7-01). Mantido em memória — o token não
 * expira automaticamente (Claude/API.md), então não há necessidade de
 * renovação; ele só é descartado no logout ou ao recarregar a página.
 */
let tokenAtual: string | null = null;

export function obterToken(): string | null {
  return tokenAtual;
}

export function definirToken(token: string | null): void {
  tokenAtual = token;
}
