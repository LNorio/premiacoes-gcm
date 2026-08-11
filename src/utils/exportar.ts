import { trechoFilialParaArquivo } from "./filial";
import { mostrarToast } from "./toast";

/** SheetJS, carregado por CDN (documento técnico, Seção 1) — sem tipos próprios no projeto. */
interface BibliotecaXLSX {
  utils: {
    aoa_to_sheet: (dados: (string | number)[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (livro: unknown, planilha: unknown, nomeAba: string) => void;
  };
  writeFile: (livro: unknown, nomeArquivo: string) => void;
}

declare global {
  interface Window {
    XLSX?: BibliotecaXLSX;
  }
}

const URL_SHEETJS = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
let carregamentoXLSX: Promise<void> | null = null;

function carregarXLSX(): Promise<void> {
  if (window.XLSX) return Promise.resolve();
  carregamentoXLSX ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = URL_SHEETJS;
    script.onload = () => resolve();
    script.onerror = () => {
      // Não deixa o cache preso numa rejeição — uma falha transitória de rede
      // não deve impedir novas tentativas de exportação depois.
      carregamentoXLSX = null;
      reject(new Error("Falha ao carregar a biblioteca de exportação Excel."));
    };
    document.body.appendChild(script);
  });
  return carregamentoXLSX;
}

/**
 * Gera e baixa um Excel (.xlsx) via SheetJS (Seção 4 do documento técnico):
 * uma aba "Dados", nome de arquivo `<base>_<filial>_<data-ISO>.xlsx`.
 */
export async function baixarExcel(
  cabecalho: string[],
  linhas: (string | number)[][],
  nomeBase: string,
  filial: string,
): Promise<void> {
  try {
    await carregarXLSX();
  } catch {
    mostrarToast("Não foi possível gerar o Excel: biblioteca não carregada. Verifique sua conexão com a internet.", "erro");
    return;
  }
  if (!window.XLSX) {
    mostrarToast("Não foi possível gerar o Excel: biblioteca não carregada. Verifique sua conexão com a internet.", "erro");
    return;
  }

  const planilha = window.XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
  const livro = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(livro, planilha, "Dados");

  const sufixoArquivo = trechoFilialParaArquivo(filial);
  window.XLSX.writeFile(livro, `${nomeBase}_${sufixoArquivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);

  mostrarToast("Arquivo Excel exportado com sucesso.", "sucesso");
}

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
