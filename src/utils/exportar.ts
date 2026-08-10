import { trechoFilialParaArquivo } from "./filial";
import { mostrarToast } from "./toast";

/**
 * Gera e baixa um CSV (Seção 4 do documento técnico): separador `;`, BOM
 * UTF-8, células entre aspas, nome de arquivo `<base>_<filial>_<data-ISO>.csv`.
 */
export function baixarCSV(cabecalho: string[], linhas: (string | number)[][], nomeBase: string, filial: string): void {
  const conteudoCSV = [cabecalho, ...linhas]
    .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + conteudoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const sufixoArquivo = trechoFilialParaArquivo(filial);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeBase}_${sufixoArquivo}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  mostrarToast("Arquivo CSV exportado com sucesso.", "sucesso");
}
