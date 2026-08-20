/**
 * Sem acento e minúsculo, pra busca não depender do usuário digitar acento certo.
 * Aceita `null`/`undefined` porque os campos buscados vêm direto da API (ex.: e-mail
 * de um colaborador sem e-mail cadastrado) — tratar como string vazia em vez de
 * deixar o `.normalize()` estourar e derrubar a tela inteira.
 */
export function normalizarBusca(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
