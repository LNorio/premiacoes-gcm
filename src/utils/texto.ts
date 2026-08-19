/** Sem acento e minúsculo, pra busca não depender do usuário digitar acento certo. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
