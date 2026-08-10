import { FILIAL_TODAS } from "../types";

/** Rótulo amigável para exibição (cabeçalho, exportações etc.) */
export function rotuloFilial(filial: string): string {
  return filial === FILIAL_TODAS ? "Todas as filiais" : `Filial ${filial}`;
}

/** Trecho usado no nome dos arquivos exportados (ver Seção 4 do documento técnico) */
export function trechoFilialParaArquivo(filial: string): string {
  return filial === FILIAL_TODAS ? "todas-filiais" : `filial-${filial}`;
}
